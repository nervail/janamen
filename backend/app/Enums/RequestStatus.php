<?php

namespace App\Enums;

final class RequestStatus
{
    public const PENDING_MANAGER = 'pending_manager';
    public const PENDING_HR = 'pending_hr';
    public const AWAITING_SIGNATURE = 'awaiting_signature';
    public const APPROVED = 'approved';
    public const REJECTED = 'rejected';
    public const CANCELLED = 'cancelled';
    public const OPEN = 'open';
    public const ANSWERED = 'answered';

    /** Заявка в работе: дни отпуска зарезервированы, даты заняты. */
    public const ACTIVE = [self::PENDING_MANAGER, self::PENDING_HR, self::AWAITING_SIGNATURE];
}