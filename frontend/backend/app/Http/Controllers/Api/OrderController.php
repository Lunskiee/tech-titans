<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['customer', 'user', 'items.product']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->orderBy('order_id', 'desc')->get();

        return response()->json([
            'orders' => $orders,
            'total' => $orders->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,customer_id',
            'status' => 'nullable|in:Pending,Processing,Completed,Cancelled',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'nullable|numeric|min:0',
        ]);

        $order = DB::transaction(function () use ($validated, $request) {
            $totalAmount = 0.00;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $unitPrice = $item['unit_price'] ?? $product->price;
                $lineTotal = $unitPrice * $item['quantity'];
                $totalAmount += $lineTotal;

                $itemsData[] = [
                    'product_id' => $product->product_id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                ];

                if ($product->stock_quantity >= $item['quantity']) {
                    $product->decrement('stock_quantity', $item['quantity']);
                }
            }

            $order = Order::create([
                'customer_id' => $validated['customer_id'],
                'user_id' => $request->user() ? $request->user()->user_id : null,
                'status' => $validated['status'] ?? 'Pending',
                'total_amount' => $totalAmount,
            ]);

            foreach ($itemsData as $item) {
                $item['order_id'] = $order->order_id;
                OrderItem::create($item);
            }

            return $order->load(['customer', 'items.product']);
        });

        return response()->json([
            'message' => 'Order created successfully',
            'order' => $order,
        ], 201);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'order' => $order->load(['customer', 'user', 'items.product']),
        ]);
    }

    public function update(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|required|in:Pending,Processing,Completed,Cancelled',
            'customer_id' => 'sometimes|required|exists:customers,customer_id',
        ]);

        $order->update($validated);

        return response()->json([
            'message' => 'Order updated successfully',
            'order' => $order->fresh()->load(['customer', 'user', 'items.product']),
        ]);
    }

    public function destroy(Order $order): JsonResponse
    {
        $order->delete();

        return response()->json([
            'message' => 'Order deleted successfully',
        ]);
    }
}

