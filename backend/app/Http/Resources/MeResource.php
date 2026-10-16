<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $employee = $this->employee->loadMissing('department');

        return [
            'id' => $this->id,
            'email' => $this->email,
            'role' => $this->role,
            'locale' => $this->locale,
            'employee' => [
                'id' => $employee->id,
                'full_name' => $employee->full_name,
                'position' => $employee->position,
                'department' => [
                    'id' => $employee->department->id,
                    'name' => $employee->department->name,
                ],
            ],
            'abilities' => [
                'team' => $this->hasSubordinates(),
                'hr' => $this->isHr(),
            ],
        ];
    }
}