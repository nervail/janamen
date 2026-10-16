<?php

namespace App\Http\Resources;

use App\Services\VacationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $e = $this->employee->loadMissing('department', 'manager');

        return [
            'last_name' => $e->last_name,
            'first_name' => $e->first_name,
            'middle_name' => $e->middle_name,
            'full_name' => $e->full_name,
            'company' => $e->company,
            'position' => $e->position,
            'department' => ['id' => $e->department->id, 'name' => $e->department->name],
            'manager' => $e->manager
                ? ['full_name' => $e->manager->full_name, 'position' => $e->manager->position]
                : null,
            'hired_at' => $e->hired_at->toDateString(),
            'vacation' => app(VacationService::class)->summary($this->resource),
            'source' => [
                'system' => $e->source,
                'synced_at' => $e->synced_at->toIso8601ZuluString(),
            ],
        ];
    }
}