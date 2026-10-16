<?php

namespace App\Integrations\Onec;

use Illuminate\Support\Facades\DB;

class MockEmployeeDataSource implements EmployeeDataSource
{
    public function fetchEmployees(): array
    {
        return DB::table('mock_onec_employees')
            ->orderBy('id')
            ->get()
            ->map(fn ($row) => json_decode($row->data, true) + [
                'external_id' => $row->external_id,
                'vacation_balance_days' => (float) $row->vacation_balance_days,
            ])
            ->all();
    }
}