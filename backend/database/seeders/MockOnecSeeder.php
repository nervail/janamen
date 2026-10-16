<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MockOnecSeeder extends Seeder
{
    public function run(): void
    {
        $items = json_decode(file_get_contents(database_path('fixtures/onec_employees.json')), true);

        foreach ($items as $item) {
            $balance = $item['vacation_balance_days'];
            $externalId = $item['external_id'];
            unset($item['external_id'], $item['vacation_balance_days']);

            DB::table('mock_onec_employees')->insert([
                'external_id' => $externalId,
                'data' => json_encode($item, JSON_UNESCAPED_UNICODE),
                'vacation_balance_days' => $balance,
            ]);
        }
    }
}