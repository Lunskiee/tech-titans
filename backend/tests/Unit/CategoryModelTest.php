<?php

namespace Tests\Unit;

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_fillable_and_creation(): void
    {
        $category = Category::create(['name' => 'Peripherals']);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Peripherals',
        ]);
        $this->assertEquals('Peripherals', $category->name);
    }
}
