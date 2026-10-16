<?php

namespace App\Support;

use App\Models\User;

class UserBrief
{
    public static function of(User $user): array
    {
        $employee = $user->employee;

        return [
            'id' => $user->id,
            'full_name' => $employee->full_name,
            'position' => $employee->position,
        ];
    }
}