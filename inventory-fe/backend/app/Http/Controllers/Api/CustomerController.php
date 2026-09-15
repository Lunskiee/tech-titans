<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query();

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'ilike', "%{$search}%");
        }

        $customers = $query->orderBy('customer_id', 'desc')->get();

        return response()->json([
            'customers' => $customers,
            'total' => $customers->count(),
        ]);
    }

    /**
     * Store a new customer.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|string|email|max:100|unique:customers,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        $customer = Customer::create($validated);

        return response()->json([
            'message' => 'Customer created successfully',
            'customer' => $customer,
        ], 201);
    }

    /**
     * Display the specified customer.
     */
    public function show(Customer $customer): JsonResponse
    {
        return response()->json([
            'customer' => $customer->load('orders'),
        ]);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'email' => 'sometimes|required|string|email|max:100|unique:customers,email,' . $customer->customer_id . ',customer_id',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        $customer->update($validated);

        return response()->json([
            'message' => 'Customer updated successfully',
            'customer' => $customer,
        ]);
    }

    /**
     * Delete customer.
     */
    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();

        return response()->json([
            'message' => 'Customer deleted successfully',
        ]);
    }
}
