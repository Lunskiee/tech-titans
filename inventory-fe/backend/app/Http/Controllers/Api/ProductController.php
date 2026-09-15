<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * Display a listing of products from PostgreSQL products table.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        // Search by name, SKU, or description
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('sku', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        $products = $query->orderBy('product_id', 'desc')->get();

        return response()->json([
            'products' => $products,
            'total' => $products->count(),
        ]);
    }

    /**
     * Store a newly created product in PostgreSQL products table.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sku' => 'required|string|max:50|unique:products,sku',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'stock' => 'nullable|integer|min:0',
            'quantity' => 'nullable|integer|min:0',
            'image_url' => 'nullable|string',
            'image' => 'nullable',
        ]);

        $stock = $validated['stock_quantity'] ?? $validated['stock'] ?? $validated['quantity'] ?? 0;
        $imageUrl = $validated['image_url'] ?? null;

        // Handle uploaded file
        if ($request->hasFile('image')) {
            $imageUrl = $request->file('image')->store('products', 'public');
        } elseif ($request->filled('image') && is_string($request->image)) {
            // Handle base64 image data URL
            if (preg_match('/^data:image\/(\w+);base64,/', $request->image, $type)) {
                $data = substr($request->image, strpos($request->image, ',') + 1);
                $data = base64_decode($data);
                $extension = strtolower($type[1]);
                $filename = 'products/' . Str::random(30) . '.' . $extension;
                Storage::disk('public')->put($filename, $data);
                $imageUrl = $filename;
            } else {
                $imageUrl = $request->image;
            }
        }

        $product = Product::create([
            'sku' => $validated['sku'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => (float) $validated['price'],
            'stock_quantity' => (int) $stock,
            'image_url' => $imageUrl,
        ]);

        return response()->json([
            'message' => 'Product created successfully',
            'product' => $product,
        ], 201);
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'product' => $product,
        ]);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'sku' => 'sometimes|required|string|max:50|unique:products,sku,' . $product->product_id . ',product_id',
            'name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'stock' => 'nullable|integer|min:0',
            'quantity' => 'nullable|integer|min:0',
            'image_url' => 'nullable|string',
            'image' => 'nullable',
        ]);

        $updateData = [];

        if (isset($validated['sku'])) {
            $updateData['sku'] = $validated['sku'];
        }

        if (isset($validated['name'])) {
            $updateData['name'] = $validated['name'];
        }

        if (array_key_exists('description', $validated)) {
            $updateData['description'] = $validated['description'];
        }

        if (isset($validated['price'])) {
            $updateData['price'] = (float) $validated['price'];
        }

        if (isset($validated['stock_quantity'])) {
            $updateData['stock_quantity'] = (int) $validated['stock_quantity'];
        } elseif (isset($validated['stock'])) {
            $updateData['stock_quantity'] = (int) $validated['stock'];
        } elseif (isset($validated['quantity'])) {
            $updateData['stock_quantity'] = (int) $validated['quantity'];
        }

        // Handle image updates
        if ($request->hasFile('image')) {
            if ($product->image_url && Storage::disk('public')->exists($product->image_url)) {
                Storage::disk('public')->delete($product->image_url);
            }
            $updateData['image_url'] = $request->file('image')->store('products', 'public');
        } elseif ($request->exists('image')) {
            if (empty($request->image)) {
                if ($product->image_url && Storage::disk('public')->exists($product->image_url)) {
                    Storage::disk('public')->delete($product->image_url);
                }
                $updateData['image_url'] = null;
            } elseif (is_string($request->image) && preg_match('/^data:image\/(\w+);base64,/', $request->image, $type)) {
                if ($product->image_url && Storage::disk('public')->exists($product->image_url)) {
                    Storage::disk('public')->delete($product->image_url);
                }
                $data = substr($request->image, strpos($request->image, ',') + 1);
                $data = base64_decode($data);
                $extension = strtolower($type[1]);
                $filename = 'products/' . Str::random(30) . '.' . $extension;
                Storage::disk('public')->put($filename, $data);
                $updateData['image_url'] = $filename;
            }
        } elseif (isset($validated['image_url'])) {
            $updateData['image_url'] = $validated['image_url'];
        }

        $product->update($updateData);

        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $product->fresh(),
        ]);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Product $product): JsonResponse
    {
        if ($product->image_url && Storage::disk('public')->exists($product->image_url)) {
            Storage::disk('public')->delete($product->image_url);
        }

        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully',
        ]);
    }
}
