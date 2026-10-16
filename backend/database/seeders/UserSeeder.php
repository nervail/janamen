<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // external_id => [email, роль]
        $users = [
            '000001' => ['director@janapost.demo', 'manager'],
            '000002' => ['hr.head@janapost.demo', 'hr'],
            '000003' => ['e.akhmetov@janapost.demo', 'manager'],
            '000004' => ['hr@janapost.demo', 'hr'],
            '000005' => ['hr2@janapost.demo', 'hr'],
            '000012' => ['a.seitkali@janapost.demo', 'employee'],
            '000013' => ['d.zhumabaev@janapost.demo', 'employee'],
            '000014' => ['t.bekov@janapost.demo', 'employee'],
            '000015' => ['a.kim@janapost.demo', 'employee'],
        ];

        $employees = Employee::pluck('id', 'external_id');

        foreach ($users as $externalId => [$email, $role]) {
            User::create([
                'employee_id' => $employees[$externalId],
                'email' => $email,
                'password' => 'demo-password',
                'role' => $role,
                'locale' => 'ru',
            ]);
        }
    }
}