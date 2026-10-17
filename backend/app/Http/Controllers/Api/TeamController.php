<?php

namespace App\Http\Controllers\Api;

use App\Enums\RequestStatus as S;
use App\Http\Controllers\Controller;
use App\Http\Resources\RequestResource;
use App\Models\HrRequest;
use App\Models\User;
use App\Services\RequestQueries;
use App\Services\VacationService;
use App\Support\Paginated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    /** Прямые подчинённые, урезанный набор полей (без даты приёма, компании и т. п.). */
    public function employees(Request $request, VacationService $vacation): JsonResponse
    {
        $manager = $request->user();

        $subordinates = User::with('employee')
            ->whereHas('employee', fn ($q) => $q->where('manager_id', $manager->employee_id))
            ->get()
            ->sortBy(fn (User $u) => $u->employee->last_name)
            ->values();

        $today = now(config('hr.timezone'))->toDateString();
        $onVacation = HrRequest::where('type', 'vacation')
            ->where('status', S::APPROVED)
            ->whereIn('author_id', $subordinates->pluck('id'))
            ->whereRaw("(payload->>'start_date')::date <= ? and (payload->>'end_date')::date >= ?", [$today, $today])
            ->pluck('author_id')
            ->all();

        return response()->json(['data' => $subordinates->map(fn (User $u) => [
            'user_id' => $u->id,
            'full_name' => $u->employee->full_name,
            'position' => $u->employee->position,
            'vacation' => $vacation->summary($u),
            'on_vacation_now' => in_array($u->id, $onVacation, true),
            'courses' => ['assigned' => 0, 'completed' => 0, 'average_progress' => 0], // заполним вместе с Academy
        ])->values()]);
    }

    /** Заявки подчинённых. Обращения в HR сюда не входят. */
    public function requests(Request $request, RequestQueries $queries): JsonResponse
    {
        $page = $queries->team($request->user())
            ->with('author.employee')
            ->where('type', '!=', 'hr_question')
            ->when($request->query('status'), fn ($q, $v) => $q->where('status', $v))
            ->when($request->query('type'), fn ($q, $v) => $q->where('type', $v))
            ->orderByDesc('id')
            ->paginate(Paginated::perPage($request));

        return Paginated::make($page, fn ($r) => (new RequestResource($r))->resolve());
    }
}