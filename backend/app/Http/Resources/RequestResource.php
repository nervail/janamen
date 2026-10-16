<?php

namespace App\Http\Resources;

use App\Enums\RequestStatus as S;
use App\Support\UserBrief;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'status' => $this->status,
            'author' => UserBrief::of($this->author),
            'payload' => $this->payload,
            'current_step' => match ($this->status) {
                S::PENDING_MANAGER => 'manager',
                S::PENDING_HR, S::OPEN => 'hr',
                S::AWAITING_SIGNATURE => 'signature',
                default => null,
            },
            'created_at' => $this->created_at->toIso8601ZuluString(),
            'updated_at' => $this->updated_at->toIso8601ZuluString(),
        ];
    }
}