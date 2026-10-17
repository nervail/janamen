<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RequestResource;
use App\Models\HrRequest;
use App\Services\RequestQueries;
use App\Services\VacationService;
use App\Support\NotificationPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\AcademyService;

class DashboardController extends Controller
{
    public function show(Request $request, VacationService $vacation, RequestQueries $queries, AcademyService $academy): JsonResponse
    {
        $user = $request->user()->loadMissing('employee.department');
        $employee = $user->employee;

        $recent = HrRequest::with('author.employee')
            ->where('author_id', $user->id)
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        $latest = $user->notifications()->orderByDesc('created_at')->limit(5)->get();

        return response()->json(['data' => [
            'profile' => [
                'full_name' => $employee->full_name,
                'position' => $employee->position,
                'department' => $employee->department->name,
            ],
            'vacation' => $vacation->summary($user),
            'recent_requests' => $recent->map(fn ($r) => (new RequestResource($r))->resolve())->values(),
            'courses' => $academy->cardsFor($user), 
            'notifications' => [
                'unread_count' => $user->unreadNotifications()->count(),
                'latest' => $latest->map(fn ($n) => NotificationPresenter::map($n))->values(),
            ],
            'team_pending_count' => $user->hasSubordinates() ? $queries->teamPending($user)->count() : null,
            'hr_queue_count' => $user->isHr() ? $queries->hrQueue($user)->count() : null,
        ]]);
    }
}