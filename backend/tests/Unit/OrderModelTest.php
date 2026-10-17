<?php

namespace Tests\Unit;

use App\Models\Order;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_primary_key_and_casts(): void
    {
        $order = new Order(['total_amount' => 199.95]);

        $this->assertEquals('order_id', $order->getKeyName());
        $this->assertEquals('199.95', $order->total_amount);
    }

    public function test_order_relationships(): void
    {
        $order = new Order;

        $customerRelation = $order->customer();
        $this->assertInstanceOf(BelongsTo::class, $customerRelation);
        $this->assertEquals('customer_id', $customerRelation->getForeignKeyName());

        $userRelation = $order->user();
        $this->assertInstanceOf(BelongsTo::class, $userRelation);
        $this->assertEquals('user_id', $userRelation->getForeignKeyName());

        $itemsRelation = $order->items();
        $this->assertInstanceOf(HasMany::class, $itemsRelation);
        $this->assertEquals('order_id', $itemsRelation->getForeignKeyName());
    }
}
