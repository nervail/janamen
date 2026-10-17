<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileResource;
use App\Http\Resources\RequestResource;
use App\Models\Department;
use App\Models\Employee;
use App\Models\HrRequest;
use App\Models\IntegrationLog;
use App\Models\User;
use App\Services\RequestQueries;
use App\Services\VacationService;
use App\Support\Paginated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\AiMessage;
use App\Support\UserBrief;

class HrController extends Controller
{
    /** queue=true: только то, что ждёт действия HR, без собственных заявок. Иначе все заявки. */
    public function requests(Request $request, RequestQueries $queries): JsonResponse
    {
        $query = $request->boolean('queue') ? $queries->hrQueue($request->user()) : HrRequest::query();

        $page = $query->with('author.employee')
            ->when($request->query('status'), fn ($q, $v) => $q->where('status', $v))
            ->when($request->query('type'), fn ($q, $v) => $q->where('type', $v))
            ->when($request->query('author_id'), fn ($q, $v) => $q->where('author_id', (int) $v))
            ->when($request->query('department_id'), fn ($q, $v) => $q->whereHas(
                'author.employee',
                fn ($e) => $e->where('department_id', (int) $v),
            ))
            ->orderByDesc('id')
            ->paginate(Paginated::perPage($request));

        return Paginated::make($page, fn ($r) => (new RequestResource($r))->resolve());
    }

    public function employees(Request $request, VacationService $vacation): JsonResponse
    {
        $query = User::with('employee.department');

        // Поиск в PHP: ILIKE по кириллице зависит от локали БД и в alpine-образе регистр не учитывает
        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $ids = Employee::all()
                ->filter(fn (Employee $e) => mb_stripos($e->full_name, $search) !== false)
                ->pluck('id');
            $query->whereIn('employee_id', $ids);
        }

        if ($department = $request->query('department_id')) {
            $query->whereHas('employee', fn ($e) => $e->where('department_id', (int) $department));
        }

        $page = $query
            ->orderBy(Employee::select('last_name')->whereColumn('employees.id', 'users.employee_id'))
            ->paginate(Paginated::perPage($request));

        return Paginated::make($page, fn (User $u) => [
            'user_id' => $u->id,
            'employee_id' => $u->employee_id,
            'full_name' => $u->employee->full_name,
            'position' => $u->employee->position,
            'department' => ['id' => $u->employee->department->id, 'name' => $u->employee->department->name],
            'role' => $u->role,
            'vacation' => $vacation->summary($u),
        ]);
    }

    public function employee(int $userId): JsonResponse
    {
        $user = User::with('employee.department', 'employee.manager')->findOrFail($userId);

        $requests = HrRequest::with('author.employee')
            ->where('author_id', $user->id)
            ->orderByDesc('id')
            ->limit(20)
            ->get()
            ->map(fn ($r) => (new RequestResource($r))->resolve())
            ->values();

        return response()->json(['data' => (new ProfileResource($user))->resolve() + [
            'requests' => $requests,
            'courses' => app(\App\Services\AcademyService::class)->cardsFor($user),
        ]]);
    }

    public function departments(): JsonResponse
    {
        return response()->json(['data' => Department::withCount('employees')
            ->orderBy('name')
            ->get()
            ->map(fn (Department $d) => [
                'id' => $d->id,
                'name' => $d->name,
                'parent_id' => $d->parent_id,
                'employees_count' => $d->employees_count,
            ])->values()]);
    }

    public function integrationLogs(Request $request): JsonResponse
    {
        $page = IntegrationLog::query()
            ->when($request->query('system'), fn ($q, $v) => $q->where('system', $v))
            ->when($request->query('status'), fn ($q, $v) => $q->where('status', $v))
            ->orderByDesc('id')
            ->paginate(Paginated::perPage($request));

        return Paginated::make($page, fn (IntegrationLog $l) => [
            'id' => $l->id,
            'system' => $l->system,
            'direction' => $l->direction,
            'operation' => $l->operation,
            'entity' => $l->entity_type ? ['type' => $l->entity_type, 'id' => $l->entity_id] : null,
            'status' => $l->status,
            'message' => $l->message,
            'created_at' => $l->created_at->toIso8601ZuluString(),
        ]);
    }

    public function aiMessages(Request $request): JsonResponse
    {
        $page = AiMessage::with('user.employee')
            ->when($request->query('result'), fn ($q, $v) => $q->where('result', $v))
            ->orderByDesc('id')
            ->paginate(Paginated::perPage($request));

        return Paginated::make($page, fn (AiMessage $m) => [
            'id' => $m->id,
            'user' => UserBrief::of($m->user),
            'question' => $m->question,
            'result' => $m->result,
            'source_keys' => $m->source_keys,
            'escalated_request_id' => $m->escalated_request_id,
            'created_at' => $m->created_at->toIso8601ZuluString(),
        ]);
    }
}