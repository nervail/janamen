<?php

namespace App\Support;

use Illuminate\Notifications\DatabaseNotification;

class NotificationPresenter
{
    public static function map(DatabaseNotification $n): array
    {
        return ['id' => $n->id] + $n->data + [
            'read_at' => $n->read_at?->toIso8601ZuluString(),
            'created_at' => $n->created_at->toIso8601ZuluString(),
        ];
    }
}