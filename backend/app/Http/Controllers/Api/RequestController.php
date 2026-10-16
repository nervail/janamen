<?php

namespace App\Http\Controllers\Api;

use App\Enums\RequestAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\RequestDetailResource;
use App\Http\Resources\RequestResource;
use App\Models\HrRequest;
use App\Services\RequestService;
use App\Services\RequestWorkflow;
use App\Support\Paginated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class RequestController extends Controller
{
    private const DETAIL_RELATIONS = ['author.employee', 'history.actor.employee'];

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 20), 1), 100);

        $page = HrRequest::with('author.employee')
            ->where('author_id', $request->user()->id)
            ->when($request->query('status'), fn ($q, $v) => $q->where('status', $v))
            ->when($request->query('type'), fn ($q, $v) => $q->where('type', $v))
            ->orderByDesc('id')
            ->paginate($perPage);

        return Paginated::make($page, fn ($r) => (new RequestResource($r))->resolve());
    }

    public function store(Request $request, RequestService $service): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['vacation'])],
            'payload' => ['required', 'array'],
            'payload.vacation_type' => ['required', Rule::in(['annual_paid', 'unpaid'])],
            'payload.start_date' => ['required', 'date_format:Y-m-d'],
            'payload.end_date' => ['required', 'date_format:Y-m-d'],
            'payload.comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $created = $service->createVacation($request->user(), $data['payload']);

        return (new RequestDetailResource($created->load(self::DETAIL_RELATIONS)))
            ->response()->setStatusCode(201);
    }

    public function show(Request $request, int $id): RequestDetailResource
    {
        $hrRequest = HrRequest::with(self::DETAIL_RELATIONS)->findOrFail($id);
        Gate::authorize('view', $hrRequest);

        return new RequestDetailResource($hrRequest);
    }

    public function action(Request $request, int $id, RequestWorkflow $workflow): RequestDetailResource
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(RequestAction::ALL)],
            'comment' => ['nullable', 'string', 'max:2000'],
            'answer' => ['nullable', 'string', 'max:5000'],
        ]);

        $workflow->perform($request->user(), $id, $data['action'], $data['comment'] ?? null, $data['answer'] ?? null);

        return new RequestDetailResource(HrRequest::with(self::DETAIL_RELATIONS)->findOrFail($id));
    }
}