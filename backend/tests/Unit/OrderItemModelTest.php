<?php

namespace Tests\Unit;

use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderItemModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_item_casts_and_primary_key(): void
    {
        $item = new OrderItem([
            'quantity' => '3',
            'unit_price' => '14.99',
        ]);

        $this->assertEquals('order_item_id', $item->getKeyName());
        $this->assertIsInt($item->quantity);
        $this->assertEquals(3, $item->quantity);
        $this->assertEquals('14.99', $item->unit_price);
        $this->assertFalse($item->timestamps);
    }

    public function test_order_item_belongs_to_order_and_product(): void
    {
        $item = new OrderItem;

        $orderRelation = $item->order();
        $this->assertInstanceOf(BelongsTo::class, $orderRelation);
        $this->assertEquals('order_id', $orderRelation->getForeignKeyName());

        $productRelation = $item->product();
        $this->assertInstanceOf(BelongsTo::class, $productRelation);
        $this->assertEquals('product_id', $productRelation->getForeignKeyName());
    }
}
