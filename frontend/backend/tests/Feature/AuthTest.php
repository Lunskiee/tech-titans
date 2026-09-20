<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Admin User',
            'email' => 'admin@vaulto.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => [
                    'user_id',
                    'name',
                    'username',
                    'email',
                ],
                'token',
            ])
            ->assertJson([
                'message' => 'Registration successful',
                'user' => [
                    'email' => 'admin@vaulto.com',
                    'name' => 'Admin User',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'admin@vaulto.com',
            'username' => 'Admin User',
        ]);
    }

    public function test_registration_validation_fails_with_invalid_or_missing_fields(): void
    {
        $response = $this->postJson('/api/register', [
            'email' => 'not-an-email',
            'password' => '123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_registration_fails_when_email_is_already_taken(): void
    {
        User::create([
            'username' => 'ExistingUser',
            'email' => 'admin@vaulto.com',
            'password_hash' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/register', [
            'name' => 'Another User',
            'email' => 'admin@vaulto.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        User::create([
            'username' => 'admin',
            'email' => 'admin@vaulto.com',
            'password_hash' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@vaulto.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user' => [
                    'user_id',
                    'name',
                    'username',
                    'email',
                ],
                'token',
            ])
            ->assertJson([
                'message' => 'Login successful',
                'user' => [
                    'email' => 'admin@vaulto.com',
                ],
            ]);
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        User::create([
            'username' => 'admin',
            'email' => 'admin@vaulto.com',
            'password_hash' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@vaulto.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid email or password credentials.',
            ]);
    }

    public function test_user_cannot_login_with_non_existent_email(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'unknown@vaulto.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid email or password credentials.',
            ]);
    }

    public function test_login_validation_requires_email_and_password(): void
    {
        $response = $this->postJson('/api/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_user_can_reset_password(): void
    {
        $user = User::create([
            'username' => 'admin',
            'email' => 'admin@vaulto.com',
            'password_hash' => Hash::make('oldpassword'),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => 'admin@vaulto.com',
            'password' => 'newpassword123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Password reset successfully.',
            ]);

        $user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $user->password_hash));
    }

    public function test_reset_password_fails_for_non_existent_email(): void
    {
        $response = $this->postJson('/api/reset-password', [
            'email' => 'nonexistent@vaulto.com',
            'password' => 'newpassword123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_retrieve_profile_and_logout(): void
    {
        $user = User::create([
            'username' => 'admin',
            'email' => 'admin@vaulto.com',
            'password_hash' => Hash::make('password123'),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        $meResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/me');

        $meResponse->assertStatus(200)
            ->assertJson([
                'user' => [
                    'email' => 'admin@vaulto.com',
                    'username' => 'admin',
                ],
            ]);

        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/logout');

        $logoutResponse->assertStatus(200)
            ->assertJson([
                'message' => 'Logged out successfully',
            ]);

        $this->assertCount(0, $user->fresh()->tokens);
    }
}

