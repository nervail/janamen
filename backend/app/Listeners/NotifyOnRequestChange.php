<?php

namespace App\Listeners;

use App\Enums\RequestAction as A;
use App\Enums\RequestStatus as S;
use App\Events\RequestStatusChanged;
use App\Models\User;
use App\Notifications\RequestNotification;
use App\Services\RequestWorkflow;
use Illuminate\Support\Collection;

class NotifyOnRequestChange
{
    public function __construct(private RequestWorkflow $workflow) {}

    public function handle(RequestStatusChanged $e): void
    {
        $request = $e->request->loadMissing('author.employee');
        $author = $request->author;
        $entry = $e->entry;

        // Кто уже согласовывал: им не нужно уведомление «ваша очередь»
        $participants = $request->history()
            ->whereIn('action', [A::MANAGER_APPROVE, A::HR_APPROVE])
            ->pluck('actor_id')->all();

        $manager = fn (): Collection => collect([$this->workflow->managerUserOf($author)]);
        $hr = fn (array $except): Collection => User::where('role', 'hr')->whereNotIn('id', $except)->get();

        $recipients = match ($entry->action) {
            A::CREATE => $request->status === S::PENDING_MANAGER ? $manager() : $hr([$author->id]),
            A::MANAGER_APPROVE => collect([$author])->merge($hr([$author->id, ...$participants])),
            A::CANCEL => $entry->from_status === S::PENDING_MANAGER ? $manager() : $hr([$author->id, ...$participants]),
            default => collect([$author]), // отклонение, «нужна подпись», подтверждено, ответ HR
        };

        $event = match ($entry->action) {
            A::CREATE => 'request_created',
            A::ANSWER => 'request_answered',
            default => 'request_status_changed',
        };

        // Автор действия сам себя не уведомляет
        $recipients->filter()
            ->reject(fn (User $u) => $u->id === $entry->actor_id)
            ->unique('id')
            ->each(fn (User $u) => $u->notify(new RequestNotification($event, $request->id, $request->status)));
    }
}