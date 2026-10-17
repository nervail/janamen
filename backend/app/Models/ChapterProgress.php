<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChapterProgress extends Model
{
    protected $table = 'chapter_progress';

    protected $guarded = [];

    protected $casts = [
        'material_viewed_at' => 'datetime',
        'passed_at' => 'datetime',
        'passed' => 'boolean',
    ];
}