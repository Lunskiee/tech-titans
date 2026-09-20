<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_all_products(): void
    {
        Product::create([
            'sku' => 'SKU-001',
            'name' => 'Wireless Mouse',
            'description' => 'Ergonomic wireless mouse',
            'price' => 29.99,
            'stock_quantity' => 15,
        ]);

        Product::create([
            'sku' => 'SKU-002',
            'name' => 'Mechanical Keyboard',
            'description' => 'RGB mechanical keyboard',
            'price' => 79.99,
            'stock_quantity' => 8,
        ]);

        $response = $this->getJson('/api/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'products',
                'total',
            ])
            ->assertJson([
                'total' => 2,
            ]);
    }

    public function test_can_search_products_by_name_or_sku(): void
    {
        Product::create([
            'sku' => 'MOUSE-01',
            'name' => 'Wireless Mouse',
            'description' => 'Office mouse',
            'price' => 29.99,
            'stock_quantity' => 15,
        ]);

        Product::create([
            'sku' => 'KEY-01',
            'name' => 'Gaming Keyboard',
            'description' => 'Mechanical keyboard',
            'price' => 89.99,
            'stock_quantity' => 5,
        ]);

        $response = $this->getJson('/api/products?search=Mouse');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'products')
            ->assertJsonPath('products.0.name', 'Wireless Mouse');
    }

    public function test_can_create_product_with_valid_details(): void
    {
        $payload = [
            'sku' => 'WM-100',
            'name' => 'Wireless Mouse',
            'description' => 'High precision optical mouse',
            'price' => 29.99,
            'stock_quantity' => 15,
        ];

        $response = $this->postJson('/api/products', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'product' => [
                    'product_id',
                    'sku',
                    'name',
                    'description',
                    'price',
                    'stock_quantity',
                ],
            ])
            ->assertJson([
                'message' => 'Product created successfully',
                'product' => [
                    'sku' => 'WM-100',
                    'name' => 'Wireless Mouse',
                    'price' => '29.99',
                    'stock_quantity' => 15,
                ],
            ]);

        $this->assertDatabaseHas('products', [
            'sku' => 'WM-100',
            'name' => 'Wireless Mouse',
        ]);
    }

    public function test_can_create_product_with_uploaded_image_file(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->createWithContent('test-image.png', 'fake-image-bytes');

        $response = $this->postJson('/api/products', [
            'sku' => 'KB-200',
            'name' => 'Keyboard',
            'price' => 49.99,
            'quantity' => 5,
            'image' => $file,
        ]);

        $response->assertStatus(201);
        $productId = $response->json('product.product_id');

        $product = Product::find($productId);
        $this->assertNotNull($product->image_url);
        Storage::disk('public')->assertExists($product->image_url);
    }

    public function test_can_create_product_with_base64_image(): void
    {
        Storage::fake('public');

        $base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $response = $this->postJson('/api/products', [
            'sku' => 'HS-300',
            'name' => 'Headset',
            'price' => 59.99,
            'stock' => 10,
            'image' => $base64Image,
        ]);

        $response->assertStatus(201);
        $product = Product::where('sku', 'HS-300')->first();
        $this->assertNotNull($product->image_url);
        Storage::disk('public')->assertExists($product->image_url);
    }

    public function test_create_product_validation_fails_for_missing_required_fields(): void
    {
        $response = $this->postJson('/api/products', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sku', 'name', 'price']);
    }

    public function test_create_product_fails_with_duplicate_sku(): void
    {
        Product::create([
            'sku' => 'DUPLICATE-SKU',
            'name' => 'Existing Product',
            'price' => 19.99,
            'stock_quantity' => 5,
        ]);

        $response = $this->postJson('/api/products', [
            'sku' => 'DUPLICATE-SKU',
            'name' => 'New Product',
            'price' => 25.00,
            'stock_quantity' => 10,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sku']);
    }

    public function test_can_get_single_product_details(): void
    {
        $product = Product::create([
            'sku' => 'SKU-SHOW',
            'name' => 'Monitored Display',
            'price' => 199.99,
            'stock_quantity' => 3,
        ]);

        $response = $this->getJson('/api/products/' . $product->product_id);

        $response->assertStatus(200)
            ->assertJson([
                'product' => [
                    'product_id' => $product->product_id,
                    'sku' => 'SKU-SHOW',
                    'name' => 'Monitored Display',
                ],
            ]);
    }

    public function test_can_update_product_details(): void
    {
        $product = Product::create([
            'sku' => 'SKU-UPDATE',
            'name' => 'Old Name',
            'price' => 10.00,
            'stock_quantity' => 5,
        ]);

        $response = $this->putJson('/api/products/' . $product->product_id, [
            'name' => 'Updated Product Name',
            'price' => 15.50,
            'stock_quantity' => 20,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Product updated successfully',
                'product' => [
                    'name' => 'Updated Product Name',
                    'price' => '15.50',
                    'stock_quantity' => 20,
                ],
            ]);

        $this->assertDatabaseHas('products', [
            'product_id' => $product->product_id,
            'name' => 'Updated Product Name',
        ]);
    }

    public function test_can_delete_product(): void
    {
        Storage::fake('public');
        $fakePath = 'products/sample.png';
        Storage::disk('public')->put($fakePath, 'sample-data');

        $product = Product::create([
            'sku' => 'SKU-DEL',
            'name' => 'To Delete',
            'price' => 9.99,
            'stock_quantity' => 1,
            'image_url' => $fakePath,
        ]);

        $response = $this->deleteJson('/api/products/' . $product->product_id);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Product deleted successfully',
            ]);

        $this->assertDatabaseMissing('products', [
            'product_id' => $product->product_id,
        ]);
        Storage::disk('public')->assertMissing($fakePath);
    }
}

