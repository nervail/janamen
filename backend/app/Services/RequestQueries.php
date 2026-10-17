<?php

namespace App\Services;

use App\Enums\RequestStatus as S;
use App\Models\HrRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class RequestQueries
{
    /** Заявки прямых подчинённых руководителя. */
    public function team(User $manager): Builder
    {
        return HrRequest::query()->whereHas(
            'author.employee',
            fn ($q) => $q->where('manager_id', $manager->employee_id),
        );
    }

    /** Заявки подчинённых, которые ждут согласования этим руководителем. */
    public function teamPending(User $manager): Builder
    {
        return $this->team($manager)->where('status', S::PENDING_MANAGER);
    }

    /** Очередь HR: нужно действие HR, свои заявки не входят. Статус open бывает только у обращений. */
    public function hrQueue(User $hr): Builder
    {
        return HrRequest::query()
            ->where('author_id', '!=', $hr->id)
            ->whereIn('status', [S::PENDING_HR, S::AWAITING_SIGNATURE, S::OPEN]);
    }
}