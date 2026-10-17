<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_all_customers(): void
    {
        Customer::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '09123456789',
            'address' => '123 Main St',
        ]);

        Customer::create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'phone' => '09987654321',
            'address' => '456 Oak Ave',
        ]);

        $response = $this->getJson('/api/customers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'customers' => [
                    '*' => ['customer_id', 'name', 'email', 'phone', 'address'],
                ],
                'total',
            ])
            ->assertJson([
                'total' => 2,
            ]);
    }

    public function test_can_search_customers_by_name(): void
    {
        Customer::create([
            'name' => 'Alice Johnson',
            'email' => 'alice@example.com',
            'phone' => '09111111111',
        ]);

        Customer::create([
            'name' => 'Bob Williams',
            'email' => 'bob@example.com',
            'phone' => '09222222222',
        ]);

        $response = $this->getJson('/api/customers?search=Alice');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'customers')
            ->assertJsonPath('customers.0.name', 'Alice Johnson');
    }

    public function test_can_search_customers_by_email_or_phone(): void
    {
        Customer::create([
            'name' => 'Charlie Brown',
            'email' => 'charlie@peanuts.com',
            'phone' => '09333333333',
        ]);

        $emailSearch = $this->getJson('/api/customers?search=peanuts.com');
        $emailSearch->assertStatus(200)
            ->assertJsonCount(1, 'customers')
            ->assertJsonPath('customers.0.name', 'Charlie Brown');

        $phoneSearch = $this->getJson('/api/customers?search=09333333333');
        $phoneSearch->assertStatus(200)
            ->assertJsonCount(1, 'customers')
            ->assertJsonPath('customers.0.name', 'Charlie Brown');
    }

    public function test_can_create_customer_with_valid_data(): void
    {
        $payload = [
            'name' => 'Sarah Connor',
            'email' => 'sarah@skynet.com',
            'phone' => '09444444444',
            'address' => '789 Pine Rd, Cyberdyne City',
        ];

        $response = $this->postJson('/api/customers', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'customer' => ['customer_id', 'name', 'email', 'phone', 'address'],
            ])
            ->assertJson([
                'message' => 'Customer created successfully',
                'customer' => [
                    'name' => 'Sarah Connor',
                    'email' => 'sarah@skynet.com',
                ],
            ]);

        $this->assertDatabaseHas('customers', [
            'email' => 'sarah@skynet.com',
            'name' => 'Sarah Connor',
        ]);
    }

    public function test_create_customer_validation_fails_for_missing_required_fields(): void
    {
        $response = $this->postJson('/api/customers', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email']);
    }

    public function test_create_customer_validation_fails_for_invalid_email(): void
    {
        $response = $this->postJson('/api/customers', [
            'name' => 'Test User',
            'email' => 'not-a-valid-email',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_create_customer_fails_with_duplicate_email(): void
    {
        Customer::create([
            'name' => 'Existing Customer',
            'email' => 'duplicate@example.com',
        ]);

        $response = $this->postJson('/api/customers', [
            'name' => 'Another Customer',
            'email' => 'duplicate@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_can_show_single_customer_with_orders(): void
    {
        $customer = Customer::create([
            'name' => 'Bruce Wayne',
            'email' => 'bruce@wayne-enterprises.com',
        ]);

        Order::create([
            'customer_id' => $customer->customer_id,
            'status' => 'Completed',
            'total_amount' => 1250.00,
        ]);

        $response = $this->getJson('/api/customers/'.$customer->customer_id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'customer' => [
                    'customer_id',
                    'name',
                    'email',
                    'orders',
                ],
            ])
            ->assertJsonCount(1, 'customer.orders');
    }

    public function test_can_update_customer_details(): void
    {
        $customer = Customer::create([
            'name' => 'Clark Kent',
            'email' => 'clark@dailyplanet.com',
            'phone' => '09555555555',
        ]);

        $response = $this->putJson('/api/customers/'.$customer->customer_id, [
            'name' => 'Superman',
            'email' => 'clark@dailyplanet.com',
            'phone' => '09999999999',
            'address' => 'Fortress of Solitude',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Customer updated successfully',
                'customer' => [
                    'name' => 'Superman',
                    'email' => 'clark@dailyplanet.com',
                    'phone' => '09999999999',
                    'address' => 'Fortress of Solitude',
                ],
            ]);

        $this->assertDatabaseHas('customers', [
            'customer_id' => $customer->customer_id,
            'name' => 'Superman',
        ]);
    }

    public function test_update_customer_fails_when_email_belongs_to_another_customer(): void
    {
        Customer::create([
            'name' => 'First Customer',
            'email' => 'first@example.com',
        ]);

        $second = Customer::create([
            'name' => 'Second Customer',
            'email' => 'second@example.com',
        ]);

        $response = $this->putJson('/api/customers/'.$second->customer_id, [
            'email' => 'first@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_can_delete_customer(): void
    {
        $customer = Customer::create([
            'name' => 'Temporary Customer',
            'email' => 'temp@example.com',
        ]);

        $response = $this->deleteJson('/api/customers/'.$customer->customer_id);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Customer deleted successfully',
            ]);

        $this->assertDatabaseMissing('customers', [
            'customer_id' => $customer->customer_id,
        ]);
    }
}
