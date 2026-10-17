<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\ChapterProgress;
use App\Models\CourseAssignment;
use App\Services\AcademyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademyController extends Controller
{
    public function __construct(private AcademyService $academy) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->academy->cardsFor($request->user())]);
    }

    public function show(Request $request, int $courseId): JsonResponse
    {
        $assignment = $this->academy->assignmentFor($request->user(), $courseId);
        $course = $assignment->course;
        $progress = $assignment->progress()->get()->keyBy('chapter_id');

        $chapters = $course->chapters()->withCount('questions')->get()->map(function (Chapter $c) use ($progress) {
            $p = $progress->get($c->id);

            return [
                'id' => $c->id,
                'position' => $c->position,
                'title' => $c->title,
            ] + $this->academy->chapterState($p) + [
                'last_score' => $p?->last_score,
                'max_score' => $p?->max_score ?? $c->questions_count,
                'attempts' => $p?->attempts ?? 0,
            ];
        })->values();

        return response()->json(['data' => [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'assignment' => $this->academy->assignmentData($assignment),
            'chapters' => $chapters,
        ]]);
    }

    public function chapter(Request $request, int $courseId, int $chapterId): JsonResponse
    {
        [$assignment, $chapter] = $this->resolve($request, $courseId, $chapterId);
        $chapter->load('questions.options');
        $p = $assignment->progress()->where('chapter_id', $chapter->id)->first();

        return response()->json(['data' => [
            'id' => $chapter->id,
            'course_id' => $courseId,
            'position' => $chapter->position,
            'title' => $chapter->title,
            'content_md' => $chapter->content_md,
            'pass_threshold' => $chapter->pass_threshold,
            'questions' => $chapter->questions->map(fn ($q) => [
                'id' => $q->id,
                'position' => $q->position,
                'text' => $q->text,
                // is_correct намеренно не отдаётся
                'options' => $q->options->map(fn ($o) => [
                    'id' => $o->id, 'position' => $o->position, 'text' => $o->text,
                ])->values(),
            ])->values(),
            'progress' => [
                'material_viewed' => (bool) $p?->material_viewed_at,
                'passed' => (bool) $p?->passed,
                'last_score' => $p?->last_score,
                'max_score' => $p?->max_score ?? $chapter->questions->count(),
                'attempts' => $p?->attempts ?? 0,
            ],
        ]]);
    }

    public function viewed(Request $request, int $courseId, int $chapterId): JsonResponse
    {
        [$assignment, $chapter] = $this->resolve($request, $courseId, $chapterId);

        $progress = $this->academy->markViewed($assignment, $chapter);
        $assignment->refresh();

        return response()->json(['data' => [
            'chapter' => ['id' => $chapter->id] + $this->academy->chapterState($progress),
            'course' => ['status' => $assignment->status, 'progress_percent' => $assignment->progress_percent],
        ]]);
    }

    public function quiz(Request $request, int $courseId, int $chapterId): JsonResponse
    {
        [$assignment, $chapter] = $this->resolve($request, $courseId, $chapterId);

        $data = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*.question_id' => ['required', 'integer'],
            'answers.*.option_id' => ['required', 'integer'],
        ]);

        $result = $this->academy->submitQuiz($assignment, $chapter, $data['answers']);
        $assignment->refresh();

        return response()->json(['data' => [
            'score' => $result['score'],
            'max_score' => $result['max_score'],
            'percent' => $result['percent'],
            'threshold' => $result['threshold'],
            'passed' => $result['passed'],
            'attempts' => $result['attempts'],
            'chapter' => ['id' => $chapter->id] + $this->academy->chapterState($result['progress']),
            'course' => [
                'status' => $assignment->status,
                'progress_percent' => $assignment->progress_percent,
                'completed_at' => $assignment->completed_at?->toIso8601ZuluString(),
            ],
        ]]);
    }

    /** Курс должен быть назначен пользователю, глава должна принадлежать курсу, иначе 404. */
    private function resolve(Request $request, int $courseId, int $chapterId): array
    {
        $assignment = $this->academy->assignmentFor($request->user(), $courseId);
        $chapter = Chapter::where('course_id', $courseId)->where('id', $chapterId)->firstOrFail();

        return [$assignment, $chapter];
    }
}