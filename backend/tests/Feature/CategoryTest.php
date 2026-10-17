<?php

namespace Tests\Feature;

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_all_categories(): void
    {
        Category::create(['name' => 'Electronics']);
        Category::create(['name' => 'Accessories']);

        $response = $this->getJson('/api/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'categories' => [
                    '*' => ['id', 'name', 'created_at', 'updated_at'],
                ],
                'category_names',
            ])
            ->assertJson([
                'category_names' => ['Accessories', 'Electronics'],
            ]);
    }

    public function test_can_create_category_with_valid_name(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => 'Office Supplies',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'category' => ['id', 'name'],
            ])
            ->assertJson([
                'message' => 'Category created successfully',
                'category' => [
                    'name' => 'Office Supplies',
                ],
            ]);

        $this->assertDatabaseHas('categories', [
            'name' => 'Office Supplies',
        ]);
    }

    public function test_create_category_fails_when_name_is_missing(): void
    {
        $response = $this->postJson('/api/categories', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_create_category_fails_with_duplicate_name(): void
    {
        Category::create(['name' => 'Audio Gear']);

        $response = $this->postJson('/api/categories', [
            'name' => 'Audio Gear',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_can_show_single_category(): void
    {
        $category = Category::create(['name' => 'Hardware']);

        $response = $this->getJson('/api/categories/'.$category->id);

        $response->assertStatus(200)
            ->assertJson([
                'category' => [
                    'id' => $category->id,
                    'name' => 'Hardware',
                ],
            ]);
    }

    public function test_can_update_category_name(): void
    {
        $category = Category::create(['name' => 'Old Category']);

        $response = $this->putJson('/api/categories/'.$category->id, [
            'name' => 'New Category Name',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Category updated successfully',
                'category' => [
                    'id' => $category->id,
                    'name' => 'New Category Name',
                ],
            ]);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'New Category Name',
        ]);
    }

    public function test_update_category_fails_if_duplicate_name_taken(): void
    {
        Category::create(['name' => 'Category One']);
        $categoryTwo = Category::create(['name' => 'Category Two']);

        $response = $this->putJson('/api/categories/'.$categoryTwo->id, [
            'name' => 'Category One',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_can_delete_category(): void
    {
        $category = Category::create(['name' => 'To Delete']);

        $response = $this->deleteJson('/api/categories/'.$category->id);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Category deleted successfully',
            ]);

        $this->assertDatabaseMissing('categories', [
            'id' => $category->id,
        ]);
    }
}
