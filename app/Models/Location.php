<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Location extends Model
{
    protected $fillable = ['province', 'municipality', 'district_id'];

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }
}
