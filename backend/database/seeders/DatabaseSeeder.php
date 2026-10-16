<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Подразделения: external_id => [название, родитель]
        $departments = [
            'DEP-01' => ['Администрация', null],
            'DEP-02' => ['HR-отдел', 'DEP-01'],
            'DEP-03' => ['Отдел логистики', 'DEP-01'],
        ];

        $dep = [];
        foreach ($departments as $ext => [$name]) {
            $dep[$ext] = Department::create([
                'external_id' => $ext, 'name' => $name, 'synced_at' => $now,
            ]);
        }
        foreach ($departments as $ext => [, $parent]) {
            if ($parent) {
                $dep[$ext]->update(['parent_id' => $dep[$parent]->id]);
            }
        }

        // Сотрудники: порядок важен, руководитель создаётся раньше подчинённых
        // [external_id, фамилия, имя, отчество, должность, подразделение, руководитель, приём, остаток, email, роль]
        $people = [
            ['000001', 'Нургалиев', 'Бауыржан', 'Серикович', 'Генеральный директор', 'DEP-01', null, '2019-01-14', 28, 'director@janapost.demo', 'manager'],
            ['000002', 'Омарова', 'Динара', 'Асылбековна', 'Руководитель HR-отдела', 'DEP-02', '000001', '2020-06-01', 21, 'hr.head@janapost.demo', 'hr'],
            ['000003', 'Ахметов', 'Ерлан', 'Болатович', 'Руководитель отдела логистики', 'DEP-03', '000001', '2020-09-07', 24, 'e.akhmetov@janapost.demo', 'manager'],
            ['000004', 'Касымова', 'Айгерим', 'Нурлановна', 'HR-специалист', 'DEP-02', '000002', '2022-02-21', 17, 'hr@janapost.demo', 'hr'],
            ['000012', 'Сейткали', 'Асель', 'Маратовна', 'Специалист по логистике', 'DEP-03', '000003', '2023-03-15', 24, 'a.seitkali@janapost.demo', 'employee'],
            ['000013', 'Жумабаев', 'Данияр', 'Ерболович', 'Менеджер по логистике', 'DEP-03', '000003', '2022-11-10', 14, 'd.zhumabaev@janapost.demo', 'employee'],
            ['000014', 'Беков', 'Тимур', 'Русланович', 'Диспетчер', 'DEP-03', '000003', '2024-04-01', 10, 't.bekov@janapost.demo', 'employee'],
            ['000015', 'Ким', 'Алина', 'Викторовна', 'Аналитик', 'DEP-03', '000003', '2021-08-23', 30, 'a.kim@janapost.demo', 'employee'],
        ];

        $emp = [];
        foreach ($people as [$ext, $last, $first, $middle, $position, $depExt, $managerExt, $hired, $balance, $email, $role]) {
            $emp[$ext] = Employee::create([
                'external_id' => $ext,
                'last_name' => $last,
                'first_name' => $first,
                'middle_name' => $middle,
                'company' => 'ТОО «Jana Post»',
                'position' => $position,
                'department_id' => $dep[$depExt]->id,
                'manager_id' => $managerExt ? $emp[$managerExt]->id : null,
                'hired_at' => $hired,
                'vacation_balance_days' => $balance,
                'synced_at' => $now,
            ]);

            User::create([
                'employee_id' => $emp[$ext]->id,
                'email' => $email,
                'password' => 'demo-password',
                'role' => $role,
                'locale' => 'ru',
            ]);
        }
    }
}