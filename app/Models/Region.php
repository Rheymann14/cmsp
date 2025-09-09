<?php



namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Str;

class Region extends Model
{
    use SoftDeletes;
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string'; // UUIDs are strings

    protected $fillable = [
        'region',
        'status',
      
    ];

    // This will generate a UUID automatically when creating a new Region
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }
}

