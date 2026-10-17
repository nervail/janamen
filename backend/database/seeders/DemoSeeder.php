<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\HrRequest;
use App\Models\User;
use App\Services\AcademyService;
use App\Services\RequestService;
use App\Services\RequestWorkflow;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->academy();
        $this->requests();
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

    /** Заявки во всех статусах. Идут через реальные сервисы: история, уведомления и интеграции настоящие. */
    private function requests(): void
    {
        $service = app(RequestService::class);
        $workflow = app(RequestWorkflow::class);

        $user = fn (string $name) => User::where('email', "{$name}@janapost.demo")->firstOrFail();

        // Отпуск: начало через $startInDays дней, длительность $days календарных дней
        $vacation = function (User $author, int $startInDays, int $days, string $comment, string $type = 'annual_paid') use ($service) {
            $start = now(config('hr.timezone'))->addDays($startInDays);

            return $service->createVacation($author, [
                'vacation_type' => $type,
                'start_date' => $start->toDateString(),
                'end_date' => $start->copy()->addDays($days - 1)->toDateString(),
                'comment' => $comment,
            ]);
        };

        $act = fn (User $by, HrRequest $r, string $action, ?string $comment = null, ?string $answer = null)
            => $workflow->perform($by, $r->id, $action, $comment, $answer);

        $akhmetov = $user('e.akhmetov');
        $hr = $user('hr');
        $hr2 = $user('hr2');

        // Асель: отклонена руководителем и отозвана самой (активных нет, можно создавать вживую)
        $asel = $user('a.seitkali');
        $r = $vacation($asel, 75, 10, 'Семейная поездка');
        $act($akhmetov, $r, 'manager_reject', 'Пересекается с выездом на объект, перенеси на декабрь');
        $r = $vacation($asel, 120, 7, 'Отдых');
        $act($asel, $r, 'cancel');

        // Жумабаев: полная цепочка до «подтверждена» (документ, приказ в 1С, остаток уменьшается),
        // плюс вторая заявка на согласовании у руководителя
        $zhum = $user('d.zhumabaev');
        $r = $vacation($zhum, 60, 5, 'Отпуск по семейным обстоятельствам');
        $act($akhmetov, $r, 'manager_approve');
        $act($hr, $r, 'hr_approve');
        $act($hr, $r, 'sign');
        $zhum = $user('d.zhumabaev'); // остаток обновился после синхронизации с 1С
        $vacation($zhum, 100, 4, 'Короткий отпуск');

        // Ким: одна на рассмотрении у HR, другая ждёт подписи документов
        $kim = $user('a.kim');
        $r = $vacation($kim, 25, 10, 'Поездка к родственникам');
        $act($akhmetov, $r, 'manager_approve');
        $r = $vacation($kim, 90, 7, 'Летний отпуск');
        $act($akhmetov, $r, 'manager_approve');
        $act($hr2, $r, 'hr_approve');

        // Беков: на согласовании у руководителя
        $vacation($user('t.bekov'), 35, 5, 'Личные дела');

        // Руководители и HR идут по той же цепочке, меняются только согласующие
        $vacation($akhmetov, 40, 6, 'Отпуск руководителя отдела');   // согласует директор
        $vacation($user('hr.head'), 55, 3, 'Отпуск руководителя HR'); // согласует директор
        $vacation($hr, 30, 4, 'Отпуск HR-специалиста');              // согласует руководитель HR, затем другой HR
        $vacation($user('director'), 50, 5, 'Отпуск директора');     // руководителя нет: сразу в очередь HR

        // Обращения в HR: открытое (из профиля) и отвеченное
        $service->createHrQuestion($asel, 'profile_correction', 'Неверно указана дата приёма, должно быть 01.03.2023');
        $answered = $service->createHrQuestion($user('t.bekov'), 'profile_correction', 'В профиле указано не то подразделение');
        $act($hr, $answered, 'answer', null, 'Данные уточнены в 1С, профиль обновится после следующей синхронизации');

        // Часть уведомлений прочитана, часть нет
        $zhum->unreadNotifications()->oldest()->limit(2)->get()->each->markAsRead();
    }
}