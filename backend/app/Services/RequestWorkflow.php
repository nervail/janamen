<?php

namespace App\Services;

use App\Enums\RequestAction as A;
use App\Enums\RequestStatus as S;
use App\Events\RequestStatusChanged;
use App\Exceptions\ApiException;
use App\Models\HrRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class RequestWorkflow
{
    /** action => [допустимые исходные статусы, целевой статус] */
    private const TRANSITIONS = [
        A::MANAGER_APPROVE => [[S::PENDING_MANAGER], S::PENDING_HR],
        A::MANAGER_REJECT => [[S::PENDING_MANAGER], S::REJECTED],
        A::HR_APPROVE => [[S::PENDING_HR], S::AWAITING_SIGNATURE],
        A::HR_REJECT => [[S::PENDING_HR], S::REJECTED],
        A::SIGN => [[S::AWAITING_SIGNATURE], S::APPROVED],
        A::CANCEL => [[S::PENDING_MANAGER, S::PENDING_HR], S::CANCELLED],
        A::ANSWER => [[S::OPEN], S::ANSWERED],
    ];

    /** Пользователь, который согласует шаг руководителя (по employees.manager_id автора). */
    public function managerUserOf(User $author): ?User
    {
        $managerId = $author->employee->manager_id;

        return $managerId ? User::with('employee')->where('employee_id', $managerId)->first() : null;
    }

    /** Почему действие недоступно (или null, если доступно). Порядок проверок важен для кодов ошибок. */
    public function denial(User $user, HrRequest $request, string $action): ?ApiException
    {
        $author = $request->author;

        // 1. Роль и связь
        $allowed = match ($action) {
            A::MANAGER_APPROVE, A::MANAGER_REJECT => $this->isManagerOf($user, $author),
            A::HR_APPROVE, A::HR_REJECT, A::SIGN, A::ANSWER => $user->isHr(),
            A::CANCEL => $user->id === $author->id,
            default => false,
        };
        if (! $allowed) {
            return new ApiException('forbidden', 403);
        }

        // 2. Согласование собственной заявки
        if ($action !== A::CANCEL && $user->id === $author->id) {
            return new ApiException('self_approval_forbidden', 403);
        }

        // 3. Допустимость по статусу
        [$from] = self::TRANSITIONS[$action];
        if (! in_array($request->status, $from, true)) {
            return new ApiException('invalid_transition', 409);
        }

        // 4. «Два ключа»: один человек не закрывает два шага согласования
        if (in_array($action, [A::HR_APPROVE, A::HR_REJECT], true) && $this->participated($user, $request)) {
            return new ApiException('already_participated', 403);
        }

        return null;
    }

    /** Действия, которые пользователь может выполнить прямо сейчас. */
    public function availableActions(User $user, HrRequest $request): array
    {
        return array_values(array_filter(
            A::ALL,
            fn (string $action) => $this->denial($user, $request, $action) === null,
        ));
    }

    public function perform(User $user, int $requestId, string $action, ?string $comment, ?string $answer): HrRequest
    {
        $entry = null;

        $request = DB::transaction(function () use ($user, $requestId, $action, $comment, $answer, &$entry) {
            $request = HrRequest::with('author.employee')->lockForUpdate()->findOrFail($requestId);

            Gate::forUser($user)->authorize('view', $request);

            if ($error = $this->denial($user, $request, $action)) {
                throw $error;
            }
            if (in_array($action, [A::MANAGER_REJECT, A::HR_REJECT], true) && blank($comment)) {
                throw new ApiException('comment_required', 422);
            }
            if ($action === A::ANSWER && blank($answer)) {
                throw ValidationException::withMessages(['answer' => ['required']]);
            }

            $from = $request->status;
            $payload = $request->payload;
            if ($action === A::ANSWER) {
                $payload['answer'] = $answer;
                $payload['answered_by'] = $user->id;
                $payload['answered_at'] = now()->toIso8601ZuluString();
            }

            $request->update(['status' => self::TRANSITIONS[$action][1], 'payload' => $payload]);

            $entry = $request->history()->create([
                'from_status' => $from,
                'to_status' => $request->status,
                'action' => $action,
                'actor_id' => $user->id,
                'comment' => $action === A::ANSWER ? null : $comment,
            ]);

            return $request;
        });

        event(new RequestStatusChanged($request, $entry));

        return $request;
    }

    private function isManagerOf(User $user, User $author): bool
    {
        $managerId = $author->employee->manager_id;

        return $managerId !== null && $managerId === $user->employee_id;
    }

    private function participated(User $user, HrRequest $request): bool
    {
        return $request->history()
            ->where('actor_id', $user->id)
            ->whereIn('action', [A::MANAGER_APPROVE, A::HR_APPROVE])
            ->exists();
    }
}