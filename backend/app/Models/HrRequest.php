<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HrRequest extends Model
{
    protected $table = 'requests';

    protected $guarded = [];

    protected $casts = ['payload' => 'array'];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function history(): HasMany
    {
        return $this->hasMany(RequestStatusHistory::class, 'request_id')->orderBy('id');
    }
}