<?php

namespace App\Console\Commands;

use App\Services\EmployeeSyncService;
use Illuminate\Console\Command;

class SyncEmployees extends Command
{
    protected $signature = 'onec:sync';

    protected $description = 'Синхронизация сотрудников и подразделений из 1С:ЗУП';

    public function handle(EmployeeSyncService $sync): int
    {
        $this->info('Синхронизировано сотрудников: ' . $sync->run());

        return self::SUCCESS;
    }
}