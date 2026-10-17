<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'user_id' => null,
            'status' => fake()->randomElement(['Pending', 'Processing', 'Completed', 'Cancelled']),
            'total_amount' => fake()->randomFloat(2, 20, 500),
        ];
    }
}
