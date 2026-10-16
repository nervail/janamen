<?php

namespace App\Exceptions;

use Exception;

/** Бизнес-ошибка API: код из api.md + HTTP-статус. */
class ApiException extends Exception
{
    public function __construct(
        public readonly string $errorCode,
        public readonly int $status,
        public readonly array $fields = [],
    ) {
        parent::__construct($errorCode);
    }
}