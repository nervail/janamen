<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Option extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected $hidden = ['is_correct']; // страховка: признак верного ответа не должен попасть в JSON

    protected $casts = ['is_correct' => 'boolean'];
}