<?php

namespace App\Integrations\Documentolog;

use App\Models\HrRequest;

class MockDocumentSigningService implements DocumentSigningService
{
    public function createVacationOrder(HrRequest $request): string
    {
        return 'DOC-' . substr(md5('vacation_order:' . $request->id), 0, 6);
    }
}