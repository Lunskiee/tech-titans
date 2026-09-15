<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    use HasFactory;

    protected $table = 'products';
    protected $primaryKey = 'product_id';

    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = null;

    protected $fillable = [
        'sku',
        'name',
        'description',
        'price',
        'stock_quantity',
        'image_url',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'stock_quantity' => 'integer',
        'price' => 'decimal:2',
    ];

    protected $appends = [
        'id',
        'stock',
        'image',
    ];

    /**
     * Compatibility accessor for id.
     */
    public function getIdAttribute(): int
    {
        return $this->product_id;
    }

    /**
     * Compatibility accessor for stock.
     */
    public function getStockAttribute(): int
    {
        return (int) $this->stock_quantity;
    }

    /**
     * Compatibility accessor for image.
     */
    public function getImageAttribute(): ?string
    {
        if (!$this->image_url) {
            return null;
        }

        if (filter_var($this->image_url, FILTER_VALIDATE_URL) || str_starts_with($this->image_url, 'data:image')) {
            return $this->image_url;
        }

        return url(Storage::url($this->image_url));
    }

    /**
     * Order items containing this product.
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'product_id', 'product_id');
    }
}
