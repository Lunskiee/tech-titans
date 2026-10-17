<?php

namespace Tests\Unit;

use App\Models\Product;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_appended_id_and_stock_attributes(): void
    {
        $product = Product::create([
            'sku' => 'SKU-UNIT-01',
            'name' => 'Sample Product',
            'price' => 19.99,
            'stock_quantity' => 42,
        ]);

        $this->assertEquals($product->product_id, $product->id);
        $this->assertEquals(42, $product->stock);
    }

    public function test_product_image_accessor_handles_null_url_and_path(): void
    {
        $noImage = new Product(['image_url' => null]);
        $this->assertNull($noImage->image);

        $external = new Product(['image_url' => 'https://example.com/item.png']);
        $this->assertEquals('https://example.com/item.png', $external->image);

        $base64 = new Product(['image_url' => 'data:image/png;base64,AAAA']);
        $this->assertEquals('data:image/png;base64,AAAA', $base64->image);

        $local = new Product(['image_url' => 'products/sample.png']);
        $this->assertStringContainsString('sample.png', $local->image);
    }

    public function test_product_casts_attributes_properly(): void
    {
        $product = Product::create([
            'sku' => 'SKU-CAST-01',
            'name' => 'Cast Test',
            'price' => '25.5',
            'stock_quantity' => '10',
        ]);

        $this->assertIsInt($product->product_id);
        $this->assertIsInt($product->stock_quantity);
        $this->assertEquals('25.50', $product->price);
    }

    public function test_product_has_many_order_items_relationship(): void
    {
        $product = new Product;
        $relation = $product->orderItems();

        $this->assertInstanceOf(HasMany::class, $relation);
        $this->assertEquals('product_id', $relation->getForeignKeyName());
    }
}
