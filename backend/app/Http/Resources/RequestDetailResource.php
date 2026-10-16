<?php

namespace App\Http\Resources;

use App\Enums\RequestStatus as S;
use App\Services\RequestWorkflow;
use App\Support\UserBrief;
use Illuminate\Http\Request;

class RequestDetailResource extends RequestResource
{
    public function toArray(Request $request): array
    {
        $workflow = app(RequestWorkflow::class);
        $approver = $this->status === S::PENDING_MANAGER ? $workflow->managerUserOf($this->author) : null;

        return parent::toArray($request) + [
            'current_approver' => $approver ? UserBrief::of($approver) : null,
            'available_actions' => $workflow->availableActions($request->user(), $this->resource),
            'history' => $this->history->map(fn ($h) => [
                'id' => $h->id,
                'action' => $h->action,
                'from_status' => $h->from_status,
                'to_status' => $h->to_status,
                'actor' => UserBrief::of($h->actor),
                'comment' => $h->comment,
                'created_at' => $h->created_at->toIso8601ZuluString(),
            ])->values(),
        ];
    }
}