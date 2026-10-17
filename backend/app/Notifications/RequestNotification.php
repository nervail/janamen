<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class RequestNotification extends Notification
{
    public function __construct(
        private string $event,
        private int $requestId,
        private string $status,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'event' => $this->event,
            'message_key' => "notifications.{$this->event}",
            'params' => ['request_id' => $this->requestId, 'status' => $this->status],
            'link' => ['entity_type' => 'request', 'entity_id' => $this->requestId],
        ];
    }
}