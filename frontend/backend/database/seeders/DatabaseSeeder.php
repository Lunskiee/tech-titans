<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@vaulto.com'],
            [
                'username' => 'Vaulto Admin',
                'password_hash' => Hash::make('password123'),
            ]
        );

        Customer::firstOrCreate(
            ['email' => 'customer@example.com'],
            [
                'name' => 'John Doe',
                'phone' => '+123456789',
                'address' => '123 Main Street',
            ]
        );

        $categories = ['Electronics', 'Accessories', 'Office Supplies'];
        foreach ($categories as $cat) {
            Category::firstOrCreate(['name' => $cat]);
        }

        $defaultProducts = [
            [
                'sku' => '#INV-9001',
                'name' => 'Wireless Keyboard',
                'description' => 'Compact Bluetooth wireless keyboard with multi-device pairing.',
                'stock_quantity' => 30,
                'price' => 28.00,
                'image_url' => null,
            ],
            [
                'sku' => '#INV-9002',
                'name' => 'Ergonomic Mouse',
                'description' => 'Precision optical rechargeable wireless mouse.',
                'stock_quantity' => 20,
                'price' => 25.00,
                'image_url' => null,
            ],
            [
                'sku' => '#INV-9003',
                'name' => 'USB-C Hub',
                'description' => '7-in-1 multi-port USB-C adapter with 4K HDMI and Power Delivery.',
                'stock_quantity' => 15,
                'price' => 45.00,
                'image_url' => null,
            ],
        ];

        foreach ($defaultProducts as $prod) {
            Product::firstOrCreate(
                ['sku' => $prod['sku']],
                $prod
            );
        }
    }
}

