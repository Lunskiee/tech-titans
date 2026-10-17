<?php

namespace Tests\Unit;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_password_hash_is_hidden_in_serialization(): void
    {
        $user = User::create([
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password_hash' => Hash::make('secret123'),
        ]);

        $array = $user->toArray();
        $this->assertArrayNotHasKey('password_hash', $array);
    }

    public function test_user_can_create_and_delete_sanctum_tokens(): void
    {
        $user = User::create([
            'username' => 'tokenuser',
            'email' => 'token@example.com',
            'password_hash' => Hash::make('secret123'),
        ]);

        $token = $user->createToken('test_token');
        $this->assertNotEmpty($token->plainTextToken);
        $this->assertCount(1, $user->tokens);

        $user->tokens()->delete();
        $this->assertCount(0, $user->fresh()->tokens);
    }
}
