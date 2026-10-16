<?php

namespace App\Policies;

use App\Models\HrRequest;
use App\Models\User;

class HrRequestPolicy
{
    /** Автор, непосредственный руководитель автора или HR. */
    public function view(User $user, HrRequest $request): bool
    {
        if ($user->id === $request->author_id || $user->isHr()) {
            return true;
        }

        $managerId = $request->author->employee->manager_id;

        return $managerId !== null && $managerId === $user->employee_id;
    }
}