<?php

namespace App\Services;

use App\Models\HrRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use App\Enums\RequestStatus;

class VacationService
{
    public function summary(User $user): array
    {
        $balance = (float) $user->employee->vacation_balance_days;

        $reserved = (float) HrRequest::where('author_id', $user->id)
            ->where('type', 'vacation')
            ->whereRaw("payload->>'vacation_type' = 'annual_paid'")
            ->whereIn('status', RequestStatus::ACTIVE)
            ->sum(DB::raw("(payload->>'days')::numeric"));

        return [
            'balance_days' => $this->num($balance),
            'reserved_days' => $this->num($reserved),
            'available_days' => $this->num($balance - $reserved),
        ];
    }

    private function num(float $v): int|float
    {
        return $v == floor($v) ? (int) $v : $v;
    }
}