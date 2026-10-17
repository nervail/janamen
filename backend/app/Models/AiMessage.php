<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiMessage extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = [];

    protected $casts = ['source_keys' => 'array'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}