<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_all_orders(): void
    {
        $customer = Customer::create([
            'name' => 'Order Client',
            'email' => 'client@orders.com',
        ]);

        $order1 = Order::create([
            'customer_id' => $customer->customer_id,
            'status' => 'Pending',
            'total_amount' => 50.00,
        ]);

        $order2 = Order::create([
            'customer_id' => $customer->customer_id,
            'status' => 'Completed',
            'total_amount' => 120.00,
        ]);

        $response = $this->getJson('/api/orders');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'orders' => [
                    '*' => ['order_id', 'customer_id', 'status', 'total_amount', 'customer', 'items'],
                ],
                'total',
            ])
            ->assertJson([
                'total' => 2,
            ]);
    }

    public function test_can_filter_orders_by_status(): void
    {
        $customer = Customer::create([
            'name' => 'Status Client',
            'email' => 'status@orders.com',
        ]);

        Order::create([
            'customer_id' => $customer->customer_id,
            'status' => 'Pending',
            'total_amount' => 50.00,
        ]);

        Order::create([
            'customer_id' => $customer->customer_id,
            'status' => 'Completed',
            'total_amount' => 100.00,
        ]);

        $response = $this->getJson('/api/orders?status=Completed');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'orders')
            ->assertJsonPath('orders.0.status', 'Completed');
    }

    public function test_can_create_order_with_valid_items_and_decrements_stock(): void
    {
        $customer = Customer::create([
            'name' => 'Buyer',
            'email' => 'buyer@shop.com',
        ]);

        $product1 = Product::create([
            'sku' => 'PROD-A',
            'name' => 'Item A',
            'price' => 25.00,
            'stock_quantity' => 10,
        ]);

        $product2 = Product::create([
            'sku' => 'PROD-B',
            'name' => 'Item B',
            'price' => 40.00,
            'stock_quantity' => 5,
        ]);

        $payload = [
            'customer_id' => $customer->customer_id,
            'status' => 'Processing',
            'items' => [
                [
                    'product_id' => $product1->product_id,
                    'quantity' => 2,
                ],
                [
                    'product_id' => $product2->product_id,
                    'quantity' => 1,
                    'unit_price' => 35.00,
                ],
            ],
        ];

        $response = $this->postJson('/api/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'order' => [
                    'order_id',
                    'customer_id',
                    'status',
                    'total_amount',
                    'items',
                ],
            ])
            ->assertJson([
                'message' => 'Order created successfully',
                'order' => [
                    'status' => 'Processing',
                    'total_amount' => '85.00',
                ],
            ]);

        $this->assertDatabaseHas('orders', [
            'customer_id' => $customer->customer_id,
            'status' => 'Processing',
            'total_amount' => 85.00,
        ]);

        $this->assertEquals(8, $product1->fresh()->stock_quantity);
        $this->assertEquals(4, $product2->fresh()->stock_quantity);

        $this->assertDatabaseHas('order_items', [
            'product_id' => $product1->product_id,
            'quantity' => 2,
            'unit_price' => 25.00,
        ]);
        $this->assertDatabaseHas('order_items', [
            'product_id' => $product2->product_id,
            'quantity' => 1,
            'unit_price' => 35.00,
        ]);
    }

    public function test_create_order_validation_fails_for_missing_required_fields(): void
    {
        $response = $this->postJson('/api/orders', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'items']);
    }

    public function test_create_order_fails_for_non_existent_customer_or_product(): void
    {
        $response = $this->postJson('/api/orders', [
            'customer_id' => 99999,
            'items' => [
                [
                    'product_id' => 88888,
                    'quantity' => 1,
                ],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'items.0.product_id']);
    }

    public function test_create_order_fails_for_invalid_status_or_quantity(): void
    {
        $customer = Customer::create([
            'name' => 'Buyer',
            'email' => 'buyer2@shop.com',
        ]);

        $product = Product::create([
            'sku' => 'SKU-QTY',
            'name' => 'Item Test',
            'price' => 10.00,
            'stock_quantity' => 5,
        ]);

        $response = $this->postJson('/api/orders', [
            'customer_id' => $customer->customer_id,
            'status' => 'InvalidStatus',
            'items' => [
                [
                    'product_id' => $product->product_id,
                    'quantity' => 0,
                ],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status', 'items.0.quantity']);
    }

    public function test_can_show_single_order_details(): void
    {
        $customer = Customer::create([
            'name' => 'Details Buyer',
            'email' => 'details@shop.com',
        ]);

        $product = Product::create([
            'sku' => 'SKU-DETAIL',
            'name' => 'Detailed Item',
            'price' => 15.00,
            'stock_quantity' => 20,
        ]);

        $order = Order::create([
            'customer_id' => $customer->customer_id,
            'status' => 'Pending',
            'total_amount' => 30.00,
        ]);

        OrderItem::create([
            'order_id' => $order->order_id,
            'product_id' => $product->product_id,
            'quantity' => 2,
            'unit_price' => 15.00,
        ]);

        $response = $this->getJson('/api/orders/'.$order->order_id);

        $response->assertStatus(200)
            ->assertJson([
                'order' => [
                    'order_id' => $order->order_id,
                    'status' => 'Pending',
                    'customer' => [
                        'customer_id' => $customer->customer_id,
                        'name' => 'Details Buyer',
                    ],
                ],
            ])
            ->assertJsonCount(1, 'order.items');
    }

    public function test_can_update_order_status(): void
    {
        $customer = Customer::create([
            'name' => 'Updater',
            'email' => 'updater@shop.com',
        ]);

        $order = Order::create([
            'customer_id' => $customer->customer_id,
            'status' => 'Pending',
            'total_amount' => 50.00,
        ]);

        $response = $this->putJson('/api/orders/'.$order->order_id, [
            'status' => 'Completed',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Order updated successfully',
                'order' => [
                    'order_id' => $order->order_id,
                    'status' => 'Completed',
                ],
            ]);

        $this->assertDatabaseHas('orders', [
            'order_id' => $order->order_id,
            'status' => 'Completed',
        ]);
    }

    public function test_update_order_fails_with_invalid_status(): void
    {
        $customer = Customer::create([
            'name' => 'Updater Fail',
            'email' => 'updaterfail@shop.com',
        ]);

        $order = Order::create([
            'customer_id' => $customer->customer_id,
            'status' => 'Pending',
            'total_amount' => 50.00,
        ]);

        $response = $this->putJson('/api/orders/'.$order->order_id, [
            'status' => 'UnknownStatus',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_can_delete_order(): void
    {
        $customer = Customer::create([
            'name' => 'Deleter',
            'email' => 'deleter@shop.com',
        ]);

        $order = Order::create([
            'customer_id' => $customer->customer_id,
            'status' => 'Cancelled',
            'total_amount' => 0.00,
        ]);

        $response = $this->deleteJson('/api/orders/'.$order->order_id);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Order deleted successfully',
            ]);

        $this->assertDatabaseMissing('orders', [
            'order_id' => $order->order_id,
        ]);
    }
}
