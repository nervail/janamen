<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\User;
use App\Services\AcademyService;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->academy();
        // демо-заявки во всех статусах добавим отдельным блоком
    }

    private function academy(): void
    {
        $academy = app(AcademyService::class);
        $hr = User::where('email', 'hr.head@janapost.demo')->firstOrFail();
        $welcome = Course::where('slug', 'welcome')->firstOrFail();
        $infosec = Course::where('slug', 'infosec')->firstOrFail();

        // welcome: всем, infosec: отделу логистики
        $academy->assign($hr, $welcome, User::with('employee')->get(), now()->addDays(14)->toDateString());
        $logistics = User::with('employee')
            ->whereHas('employee.department', fn ($q) => $q->where('external_id', 'DEP-03'))
            ->get();
        $academy->assign($hr, $infosec, $logistics, now()->addDays(21)->toDateString());

        // Асель: в процессе (1 глава из 3), Жумабаев: завершил курс, остальные не начинали
        $this->progress('a.seitkali@janapost.demo', $welcome, 1);
        $this->progress('d.zhumabaev@janapost.demo', $welcome, 3);
    }

    private function progress(string $email, Course $course, int $chapters): void
    {
        $academy = app(AcademyService::class);
        $user = User::where('email', $email)->firstOrFail();
        $assignment = CourseAssignment::with('course')
            ->where('user_id', $user->id)->where('course_id', $course->id)->firstOrFail();

        foreach ($course->chapters()->limit($chapters)->get() as $chapter) {
            $academy->markViewed($assignment, $chapter);

            $answers = $chapter->questions()->with('options')->get()->map(fn ($q) => [
                'question_id' => $q->id,
                'option_id' => $q->options->firstWhere('is_correct', true)->id,
            ])->all();

            $academy->submitQuiz($assignment, $chapter, $answers);
        }
    }
}