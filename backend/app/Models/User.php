<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $guarded = [];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['password' => 'hashed'];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function isHr(): bool
    {
        return $this->role === 'hr';
    }

    public function hasSubordinates(): bool
    {
        return $this->employee->subordinates()->exists();
    }
    
    /** Уровни документов базы знаний, доступные пользователю. */
    public function kbAccessLevels(): array
    {
        if ($this->isHr()) {
            return ['all', 'manager', 'hr'];
        }

        return ($this->role === 'manager' || $this->hasSubordinates()) ? ['all', 'manager'] : ['all'];
    }
}