<?php

namespace App\Services;

use App\Integrations\Onec\EmployeeDataSource;
use App\Models\Department;
use App\Models\Employee;
use App\Models\IntegrationLog;
use Illuminate\Support\Facades\DB;
use Throwable;

class EmployeeSyncService
{
    public function __construct(private EmployeeDataSource $source) {}

    /** @return int количество синхронизированных сотрудников */
    public function run(): int
    {
        try {
            $items = $this->source->fetchEmployees();
            DB::transaction(fn () => $this->apply($items));
        } catch (Throwable $e) {
            IntegrationLog::create([
                'system' => 'onec_zup', 'direction' => 'inbound', 'operation' => 'sync_employees',
                'status' => 'error', 'message' => mb_substr('Ошибка синхронизации: ' . $e->getMessage(), 0, 500),
            ]);
            throw $e;
        }

        IntegrationLog::create([
            'system' => 'onec_zup', 'direction' => 'inbound', 'operation' => 'sync_employees',
            'status' => 'success', 'message' => 'Синхронизировано сотрудников: ' . count($items),
        ]);

        return count($items);
    }

    private function apply(array $items): void
    {
        $now = now();

        // 1. Подразделения (сначала без родителей, затем проставляем parent_id)
        $deps = [];
        foreach ($items as $item) {
            $deps[$item['department']['external_id']] = $item['department'];
        }
        foreach ($deps as $ext => $d) {
            Department::updateOrCreate(
                ['external_id' => $ext],
                ['name' => $d['name'], 'source' => 'onec_zup', 'synced_at' => $now],
            );
        }
        $depIds = Department::pluck('id', 'external_id');
        foreach ($deps as $ext => $d) {
            $parent = $d['parent_external_id'] ?? null;
            Department::where('external_id', $ext)->update(['parent_id' => $parent ? $depIds[$parent] : null]);
        }

        // 2. Сотрудники (сначала без руководителей, затем manager_id)
        foreach ($items as $item) {
            Employee::updateOrCreate(
                ['external_id' => $item['external_id']],
                [
                    'last_name' => $item['last_name'],
                    'first_name' => $item['first_name'],
                    'middle_name' => $item['middle_name'] ?? null,
                    'company' => $item['company'],
                    'position' => $item['position'],
                    'department_id' => $depIds[$item['department']['external_id']],
                    'hired_at' => $item['hired_at'],
                    'vacation_balance_days' => $item['vacation_balance_days'],
                    'source' => 'onec_zup',
                    'synced_at' => $now,
                ],
            );
        }
        $empIds = Employee::pluck('id', 'external_id');
        foreach ($items as $item) {
            $manager = $item['manager_external_id'] ?? null;
            Employee::where('external_id', $item['external_id'])
                ->update(['manager_id' => $manager ? $empIds[$manager] : null]);
        }
    }
}