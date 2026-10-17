<?php

namespace App\Integrations\Onec;

use Illuminate\Support\Facades\DB;
use RuntimeException;

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

    public function sendVacationOrder(array $order): array
    {
        return DB::transaction(function () use ($order) {
            $employee = DB::table('mock_onec_employees')
                ->where('external_id', $order['employee_external_id'])
                ->lockForUpdate()
                ->first();

            if (! $employee) {
                throw new RuntimeException('Сотрудник не найден в 1С');
            }

            // Отпуск без сохранения остаток не списывает
            $deduct = ($order['vacation_type'] ?? 'annual_paid') === 'annual_paid' ? (float) $order['days'] : 0.0;
            if ((float) $employee->vacation_balance_days < $deduct) {
                throw new RuntimeException('Недостаточно остатка отпуска в 1С');
            }

            DB::table('mock_onec_vacation_orders')->insert([
                'employee_external_id' => $order['employee_external_id'],
                'request_id' => $order['request_id'],
                'start_date' => $order['start_date'],
                'end_date' => $order['end_date'],
                'days' => $order['days'],
            ]);

            DB::table('mock_onec_employees')->where('id', $employee->id)
                ->decrement('vacation_balance_days', $deduct, ['updated_at' => now()]);

            return [
                'order_id' => sprintf('ORD-%s-%04d', now()->year, $order['request_id']),
                'vacation_balance_days' => (float) DB::table('mock_onec_employees')
                    ->where('id', $employee->id)->value('vacation_balance_days'),
            ];
        });
    }
}