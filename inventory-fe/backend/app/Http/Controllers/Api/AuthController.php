<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Register a new user into PostgreSQL users table.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'nullable|string|max:50',
            'name' => 'nullable|string|max:50',
            'email' => 'required|string|email|max:100|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $username = $validated['username'] ?? $validated['name'] ?? explode('@', $validated['email'])[0];

        $user = User::create([
            'username' => $username,
            'email' => $validated['email'],
            'password_hash' => Hash::make($validated['password']),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'user' => [
                'user_id' => $user->user_id,
                'name' => $user->username,
                'username' => $user->username,
                'email' => $user->email,
            ],
            'token' => $token,
        ], 201);
    }

    /**
     * Log in an existing user from PostgreSQL users table.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password_hash)) {
            return response()->json([
                'message' => 'Invalid email or password credentials.',
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                'user_id' => $user->user_id,
                'name' => $user->username,
                'username' => $user->username,
                'email' => $user->email,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Log out current user.
     */
    public function logout(Request $request): JsonResponse
    {
        if ($request->user() && $request->user()->currentAccessToken()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get current user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'user' => [
                'user_id' => $user->user_id,
                'name' => $user->username,
                'username' => $user->username,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Reset password in PostgreSQL users table.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $validated['email'])->first();
        $user->password_hash = Hash::make($validated['password']);
        $user->save();

        return response()->json([
            'message' => 'Password reset successfully.',
        ]);
    }
}
