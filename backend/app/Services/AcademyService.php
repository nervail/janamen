<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\ChapterProgress;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\User;
use App\Notifications\CourseNotification;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Throwable;

class AcademyService
{
    public function __construct(private RequestWorkflow $workflow) {}

    /** Назначение курса. Повторное назначение пропускается. */
    public function assign(User $assigner, Course $course, Collection $users, ?string $dueDate): array
    {
        $created = 0;
        $skipped = 0;

        foreach ($users as $user) {
            $assignment = CourseAssignment::firstOrCreate(
                ['course_id' => $course->id, 'user_id' => $user->id],
                ['assigned_by' => $assigner->id, 'due_date' => $dueDate],
            );

            if ($assignment->wasRecentlyCreated) {
                $created++;
                $this->notify($user, new CourseNotification('course_assigned', $course->id, $course->title));
            } else {
                $skipped++;
            }
        }

        return ['created' => $created, 'skipped_already_assigned' => $skipped];
    }

    public function assignmentFor(User $user, int $courseId): CourseAssignment
    {
        return CourseAssignment::with('course')
            ->where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->firstOrFail();
    }

    /** Карточка курса с назначением (формат CourseAssignment из api.md). */
    public function card(CourseAssignment $a): array
    {
        $course = $a->course;

        return [
            'course' => [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'description' => $course->description,
                'chapters_count' => $course->chapters_count ?? $course->chapters()->count(),
            ],
            'assignment' => $this->assignmentData($a),
        ];
    }

    public function assignmentData(CourseAssignment $a): array
    {
        return [
            'id' => $a->id,
            'status' => $a->status,
            'progress_percent' => $a->progress_percent,
            'due_date' => $a->due_date?->toDateString(),
            'assigned_at' => $a->created_at->toIso8601ZuluString(),
            'completed_at' => $a->completed_at?->toIso8601ZuluString(),
        ];
    }

    public function cardsFor(User $user): array
    {
        return CourseAssignment::with(['course' => fn ($q) => $q->withCount('chapters')])
            ->where('user_id', $user->id)
            ->orderBy('id')
            ->get()
            ->map(fn (CourseAssignment $a) => $this->card($a))
            ->values()
            ->all();
    }

    public function chapterState(?ChapterProgress $p): array
    {
        $viewed = (bool) $p?->material_viewed_at;
        $passed = (bool) $p?->passed;

        return ['material_viewed' => $viewed, 'passed' => $passed, 'completed' => $viewed && $passed];
    }

    public function markViewed(CourseAssignment $a, Chapter $chapter): ChapterProgress
    {
        $progress = ChapterProgress::firstOrCreate(['assignment_id' => $a->id, 'chapter_id' => $chapter->id]);

        if (! $progress->material_viewed_at) {
            $progress->update(['material_viewed_at' => now()]);
        }

        $this->recalculate($a);

        return $progress->refresh();
    }

    /** Проверка теста целиком на бэкенде. Какие именно ответы неверны, не сообщается. */
    public function submitQuiz(CourseAssignment $a, Chapter $chapter, array $answers): array
    {
        $questions = $chapter->questions()->with('options')->get();
        $chosen = [];
        $errors = [];

        foreach ($answers as $i => $answer) {
            $question = $questions->firstWhere('id', $answer['question_id']);
            if (! $question) {
                $errors["answers.$i.question_id"] = ['invalid_value'];
                continue;
            }
            $option = $question->options->firstWhere('id', $answer['option_id']);
            if (! $option) {
                $errors["answers.$i.option_id"] = ['invalid_option'];
                continue;
            }
            $chosen[$question->id] = $option;
        }

        if (! $errors && count($chosen) !== $questions->count()) {
            $errors['answers'] = ['incomplete_answers'];
        }
        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        $score = collect($chosen)->filter(fn ($o) => $o->is_correct)->count();
        $max = $questions->count();
        $percent = $max > 0 ? (int) round($score / $max * 100) : 0;
        $passedNow = $percent >= $chapter->pass_threshold;

        $progress = ChapterProgress::firstOrCreate(['assignment_id' => $a->id, 'chapter_id' => $chapter->id]);
        $progress->refresh();
        $progress->last_score = $score;
        $progress->max_score = $max;
        $progress->attempts = $progress->attempts + 1;
        if ($passedNow && ! $progress->passed) { // однажды сданная глава остаётся сданной
            $progress->passed = true;
            $progress->passed_at = now();
        }
        $progress->save();

        $this->recalculate($a);

        return [
            'score' => $score,
            'max_score' => $max,
            'percent' => $percent,
            'threshold' => $chapter->pass_threshold,
            'passed' => $passedNow,
            'attempts' => $progress->attempts,
            'progress' => $progress,
        ];
    }

    /** Глава засчитана: материал просмотрен и тест сдан. Прогресс = засчитанные главы / все главы. */
    public function recalculate(CourseAssignment $a): void
    {
        $total = $a->course->chapters()->count();
        $progress = $a->progress()->get();

        $done = $progress->filter(fn ($p) => $p->material_viewed_at && $p->passed)->count();
        $percent = $total > 0 ? (int) round($done / $total * 100) : 0;
        $started = $progress->contains(fn ($p) => $p->material_viewed_at || $p->attempts > 0);

        $status = $percent >= 100 ? 'completed' : ($started ? 'in_progress' : 'not_started');
        $wasCompleted = $a->status === 'completed';

        $a->update([
            'progress_percent' => $percent,
            'status' => $status,
            'completed_at' => $status === 'completed' ? ($a->completed_at ?? now()) : null,
        ]);

        if ($status === 'completed' && ! $wasCompleted) {
            $this->notifyCompleted($a);
        }
    }

    private function notifyCompleted(CourseAssignment $a): void
    {
        $a->loadMissing('course', 'user.employee');
        $worker = $a->user;
        $name = $worker->employee->full_name;

        // Работник, его руководитель и все HR
        $recipients = collect([$worker, $this->workflow->managerUserOf($worker)])
            ->merge(User::where('role', 'hr')->get())
            ->filter()
            ->unique('id');

        foreach ($recipients as $recipient) {
            $own = $recipient->id === $worker->id;
            $this->notify($recipient, new CourseNotification(
                'course_completed', $a->course->id, $a->course->title, $own ? null : $name, $own,
            ));
        }
    }

    private function notify(User $user, CourseNotification $notification): void
    {
        try {
            $user->notify($notification);
        } catch (Throwable $t) {
            report($t); // сбой уведомления не должен ломать прохождение курса
        }
    }
}