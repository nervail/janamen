<?php

namespace App\Enums;

final class RequestAction
{
    public const CREATE = 'create';
    public const MANAGER_APPROVE = 'manager_approve';
    public const MANAGER_REJECT = 'manager_reject';
    public const HR_APPROVE = 'hr_approve';
    public const HR_REJECT = 'hr_reject';
    public const SIGN = 'sign';
    public const CANCEL = 'cancel';
    public const ANSWER = 'answer';

    /** Действия, доступные через POST /requests/{id}/actions. */
    public const ALL = [
        self::MANAGER_APPROVE, self::MANAGER_REJECT, self::HR_APPROVE, self::HR_REJECT,
        self::SIGN, self::CANCEL, self::ANSWER,
    ];
}