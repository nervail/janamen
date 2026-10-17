<?php

namespace App\Integrations\Documentolog;

use App\Models\HrRequest;

interface DocumentSigningService
{
    /** Создаёт документ «Приказ об отпуске» на подпись, возвращает document_ref. */
    public function createVacationOrder(HrRequest $request): string;
}