<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\User;
use App\Services\AcademyService;
use App\Support\Paginated;
use App\Support\UserBrief;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class HrAcademyController extends Controller
{
    public function courses(): JsonResponse
    {
        $stats = CourseAssignment::selectRaw('course_id, status, count(*) as total')
            ->groupBy('course_id', 'status')
            ->get()
            ->groupBy('course_id');

        return response()->json(['data' => Course::withCount('chapters')->orderBy('id')->get()->map(function (Course $c) use ($stats) {
            $by = ($stats->get($c->id) ?? collect())->pluck('total', 'status');

            return [
                'id' => $c->id,
                'slug' => $c->slug,
                'title' => $c->title,
                'chapters_count' => $c->chapters_count,
                'stats' => [
                    'assigned' => (int) $by->sum(),
                    'not_started' => (int) ($by['not_started'] ?? 0),
                    'in_progress' => (int) ($by['in_progress'] ?? 0),
                    'completed' => (int) ($by['completed'] ?? 0),
                ],
            ];
        })->values()]);
    }

    public function assignments(Request $request): JsonResponse
    {
        $page = CourseAssignment::with(['course', 'user.employee'])
            ->when($request->query('course_id'), fn ($q, $v) => $q->where('course_id', (int) $v))
            ->when($request->query('status'), fn ($q, $v) => $q->where('status', $v))
            ->when($request->query('department_id'), fn ($q, $v) => $q->whereHas(
                'user.employee',
                fn ($e) => $e->where('department_id', (int) $v),
            ))
            ->orderByDesc('id')
            ->paginate(Paginated::perPage($request));

        return Paginated::make($page, fn (CourseAssignment $a) => [
            'id' => $a->id,
            'course' => ['id' => $a->course->id, 'title' => $a->course->title],
            'user' => UserBrief::of($a->user),
            'status' => $a->status,
            'progress_percent' => $a->progress_percent,
            'due_date' => $a->due_date?->toDateString(),
            'completed_at' => $a->completed_at?->toIso8601ZuluString(),
        ]);
    }

    /** Назначить курс списку сотрудников или всему подразделению (ровно одно из user_ids / department_id). */
    public function assign(Request $request, AcademyService $academy): JsonResponse
    {
        $data = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'user_ids' => ['required_without:department_id', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'exists:users,id'],
            'department_id' => ['required_without:user_ids', 'integer', 'exists:departments,id'],
            'due_date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        if (isset($data['user_ids'], $data['department_id'])) {
            throw ValidationException::withMessages([
                'user_ids' => ['invalid_value'],
                'department_id' => ['invalid_value'],
            ]);
        }
        if (! empty($data['due_date']) && $data['due_date'] < now(config('hr.timezone'))->toDateString()) {
            throw ValidationException::withMessages(['due_date' => ['date_in_past']]);
        }

        $users = isset($data['user_ids'])
            ? User::with('employee')->whereIn('id', $data['user_ids'])->get()
            : User::with('employee')->whereHas('employee', fn ($q) => $q->where('department_id', $data['department_id']))->get();

        $result = $academy->assign($request->user(), Course::findOrFail($data['course_id']), $users, $data['due_date'] ?? null);

        return response()->json(['data' => $result], 201);
    }
}