<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'customers';
    protected $primaryKey = 'customer_id';

    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = null;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
    ];

    /**
     * Orders placed by this customer.
     */
    public function orders()
    {
        return $this->hasMany(Order::class, 'customer_id', 'customer_id');
    }
}
