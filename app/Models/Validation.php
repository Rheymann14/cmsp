<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Validation extends Model
{
    use HasFactory;

    protected $fillable = [
        'cmsp_id',
        'tracking_no',
        'document_status',
        'no_siblings',
        'initial_rank',
        'validator_notes',
        'remarks',
        'checked_by',
    ];

    protected $casts = [
        'no_siblings' => 'integer',
    ];

    public function application()
    {
        return $this->belongsTo(CmspApplication::class, 'cmsp_id');
    }

    public function checker()
    {
        return $this->belongsTo(User::class, 'checked_by');
    }
}
