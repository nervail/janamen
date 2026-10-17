<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DemoReset extends Command
{
    protected $signature = 'demo:reset';

    protected $description = 'Пересоздать базу: миграции, базовые сиды и демо-данные';

    public function handle(): int
    {
        $this->call('migrate:fresh', ['--seed' => true, '--force' => true]);
        $this->call('db:seed', ['--class' => 'DemoSeeder', '--force' => true]);

        return self::SUCCESS;
    }
}