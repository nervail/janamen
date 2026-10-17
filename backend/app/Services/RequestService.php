<?php

namespace App\Services;

use App\Enums\RequestAction;
use App\Enums\RequestStatus;
use App\Events\RequestStatusChanged;
use App\Exceptions\ApiException;
use App\Models\HrRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RequestService
{
    public function __construct(
        private VacationService $vacation,
        private RequestWorkflow $workflow,
    ) {}

    public function createVacation(User $author, array $input): HrRequest
    {
        $author->loadMissing('employee');

        $payload = $this->validateVacation($author, $input);
        $this->assertApproversExist($author);

        $status = $author->employee->manager_id ? RequestStatus::PENDING_MANAGER : RequestStatus::PENDING_HR;

        [$request, $entry] = DB::transaction(function () use ($author, $payload, $status) {
            $request = HrRequest::create([
                'type' => 'vacation',
                'author_id' => $author->id,
                'status' => $status,
                'payload' => $payload,
            ]);

            $entry = $request->history()->create([
                'from_status' => null,
                'to_status' => $status,
                'action' => RequestAction::CREATE,
                'actor_id' => $author->id,
            ]);

            return [$request, $entry];
        });

        event(new RequestStatusChanged($request, $entry));

        return $request;
    }

    /** Бизнес-проверки. Ошибки полей собираются в одну ValidationException с кодами из api.md. */
    private function validateVacation(User $author, array $input): array
    {
        $start = Carbon::createFromFormat('!Y-m-d', $input['start_date']);
        $end = Carbon::createFromFormat('!Y-m-d', $input['end_date']);
        $today = now(config('hr.timezone'))->toDateString();
        $errors = [];

        if ($start->toDateString() < $today) {
            $errors['payload.start_date'][] = 'date_in_past';
        }
        if ($end->lt($start)) {
            $errors['payload.end_date'][] = 'end_before_start';
        }

        $days = $end->lt($start) ? 0 : (int) $start->diffInDays($end) + 1;

        if (! $errors) {
            $overlap = HrRequest::where('author_id', $author->id)
                ->where('type', 'vacation')
                ->whereIn('status', [...RequestStatus::ACTIVE, RequestStatus::APPROVED])
                ->whereRaw("(payload->>'start_date')::date <= ? and (payload->>'end_date')::date >= ?", [
                    $end->toDateString(), $start->toDateString(),
                ])
                ->exists();
            if ($overlap) {
                $errors['payload.start_date'][] = 'dates_overlap';
            }

            if ($input['vacation_type'] === 'annual_paid'
                && $days > $this->vacation->summary($author)['available_days']) {
                $errors['payload.end_date'][] = 'insufficient_balance';
            }
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        return [
            'vacation_type' => $input['vacation_type'],
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'days' => $days,
            'comment' => $input['comment'] ?? null,
            'document_ref' => null,
        ];
    }

    /** Для каждого шага маршрута должен быть допустимый согласующий. */
    private function assertApproversExist(User $author): void
    {
        $managerUser = null;

        if ($author->employee->manager_id) {
            $managerUser = $this->workflow->managerUserOf($author);
            if (! $managerUser) {
                throw new ApiException('no_available_approver', 422);
            }
        }

        $hrExists = User::where('role', 'hr')
            ->where('id', '!=', $author->id)
            ->when($managerUser, fn ($q) => $q->where('id', '!=', $managerUser->id))
            ->exists();

        if (! $hrExists) {
            throw new ApiException('no_available_approver', 422);
        }
    }

    public function createHrQuestion(User $author, string $topic, string $question, ?int $aiMessageId = null): HrRequest
    {
        // Некому ответить, если нет HR, кроме самого автора
        if (! User::where('role', 'hr')->where('id', '!=', $author->id)->exists()) {
            throw new ApiException('no_available_approver', 422);
        }

        [$request, $entry] = DB::transaction(function () use ($author, $topic, $question, $aiMessageId) {
            $request = HrRequest::create([
                'type' => 'hr_question',
                'author_id' => $author->id,
                'status' => RequestStatus::OPEN,
                'payload' => [
                    'topic' => $topic,
                    'question' => $question,
                    'ai_message_id' => $aiMessageId,
                    'answer' => null,
                    'answered_by' => null,
                    'answered_at' => null,
                ],
            ]);

            $entry = $request->history()->create([
                'from_status' => null,
                'to_status' => RequestStatus::OPEN,
                'action' => RequestAction::CREATE,
                'actor_id' => $author->id,
            ]);

            return [$request, $entry];
        });

        event(new RequestStatusChanged($request, $entry));

        return $request;
    }
}