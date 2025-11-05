<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AyDeadline extends Model
{
    use HasFactory;

    // Explicitly set table name (not following Laravel plural convention)
    protected $table = 'ay_deadline';

    // Allow mass assignment
    protected $fillable = [
        'academic_year',
        'deadline',
        'is_enabled',
        'new_slots',
    ];

    // Cast deadline to date instance
    protected $casts = [
        'deadline' => 'date',
        'is_enabled' => 'boolean',
        'new_slots' => 'integer',
    ];

    protected $appends = [
        'deadline_formatted',
    ];

    // Accessor for formatted deadline (June 20, 2025)
    public function getDeadlineFormattedAttribute(): string
    {
        return $this->deadline?->format('F d, Y') ?? '';
    }
}
