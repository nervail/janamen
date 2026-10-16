<?php

namespace App\Integrations\Onec;

use Illuminate\Support\Facades\Http;

/** Точка подключения реальной 1С:ЗУП. Контракт тот же, что у мока. */
class HttpEmployeeDataSource implements EmployeeDataSource
{
    public function __construct(private string $baseUrl, private string $token) {}

    public function fetchEmployees(): array
    {
        return Http::withHeaders(['X-Integration-Token' => $this->token])
            ->timeout(10)
            ->get(rtrim($this->baseUrl, '/') . '/employees')
            ->throw()
            ->json('employees', []);
    }
}