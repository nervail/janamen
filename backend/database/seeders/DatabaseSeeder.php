<?php

namespace Database\Seeders;

use App\Services\EmployeeSyncService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(MockOnecSeeder::class);      // «сторона 1С»
        app(EmployeeSyncService::class)->run();  // read-модель employees/departments
        $this->call(UserSeeder::class);          // учётные записи платформы
        $this->call(CourseSeeder::class);
        $this->call(KbSeeder::class);
    }
}