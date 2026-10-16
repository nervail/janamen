<?php

namespace App\Events;

use App\Models\HrRequest;
use App\Models\RequestStatusHistory;

class RequestStatusChanged
{
    public function __construct(
        public HrRequest $request,
        public RequestStatusHistory $entry,
    ) {}
}