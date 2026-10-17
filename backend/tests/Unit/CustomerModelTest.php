<?php

namespace Tests\Unit;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_primary_key_and_fillable_attributes(): void
    {
        $customer = new Customer([
            'name' => 'Bruce Wayne',
            'email' => 'bruce@wayne.com',
            'phone' => '1234567890',
            'address' => 'Gotham City',
        ]);

        $this->assertEquals('customer_id', $customer->getKeyName());
        $this->assertEquals('Bruce Wayne', $customer->name);
        $this->assertEquals('bruce@wayne.com', $customer->email);
    }

    public function test_customer_has_many_orders_relationship(): void
    {
        $customer = new Customer;
        $relation = $customer->orders();

        $this->assertInstanceOf(HasMany::class, $relation);
        $this->assertEquals('customer_id', $relation->getForeignKeyName());
    }
}
