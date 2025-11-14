<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReferencePoint extends Model
{
    use HasFactory;

    public const CATEGORY_GRADE = 'grade';
    public const CATEGORY_INCOME = 'income';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'category',
        'range_from',
        'range_to',
        'equivalent_points',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'range_from' => 'float',
        'range_to' => 'float',
        'equivalent_points' => 'int',
    ];
}
