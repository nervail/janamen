<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    public function options(): HasMany
    {
        return $this->hasMany(Option::class)->orderBy('position');
    }
}