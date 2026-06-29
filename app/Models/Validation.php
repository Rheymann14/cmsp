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
        'has_medical_issue_proof',
        'initial_rank',
        'validator_notes',
        'remarks',
        'qualification_status',
        'disqualification_reasons',
        'checked_by',
    ];

    protected $casts = [
        'no_siblings' => 'integer',
        'has_medical_issue_proof' => 'boolean',
        'disqualification_reasons' => 'array',
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
