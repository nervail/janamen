<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\Paginated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;
use App\Support\NotificationPresenter;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 20), 1), 100);

        $page = $request->user()->notifications()
            ->when($request->boolean('unread'), fn ($q) => $q->whereNull('read_at'))
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return Paginated::make($page, fn (DatabaseNotification $n) => NotificationPresenter::map($n));
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json(['data' => [
            'count' => $user->unreadNotifications()->count(),
            'latest_created_at' => $user->notifications()->latest()->first()?->created_at?->toIso8601ZuluString(),
        ]]);
    }

    public function read(Request $request, string $id): Response
    {
        abort_unless(Str::isUuid($id), 404);

        $request->user()->notifications()->where('id', $id)->firstOrFail()->markAsRead();

        return response()->noContent();
    }

    public function readAll(Request $request): Response
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->noContent();
    }
}