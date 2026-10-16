<?php

namespace App\Integrations\Onec;

interface EmployeeDataSource
{
    /**
     * Сотрудники в формате, который отдаёт 1С (см. api.md, GET /api/mock/onec/employees).
     *
     * @return array<int, array<string, mixed>>
     */
    public function fetchEmployees(): array;
}