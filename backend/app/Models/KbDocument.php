<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KbDocument extends Model
{
    protected $guarded = [];

    public function sections(): HasMany
    {
        return $this->hasMany(KbSection::class, 'document_id')->orderBy('position');
    }
}