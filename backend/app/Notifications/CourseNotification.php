<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class CourseNotification extends Notification
{
    public function __construct(
        private string $event,
        private int $courseId,
        private string $courseTitle,
        private ?string $employeeName = null, // для руководителя и HR: кто завершил
        private bool $withLink = true,        // у руководителя и HR нет доступа к странице курса работника
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
            'params' => array_filter([
                'course_id' => $this->courseId,
                'course_title' => $this->courseTitle,
                'employee_name' => $this->employeeName,
            ], fn ($v) => $v !== null),
            'link' => $this->withLink ? ['entity_type' => 'course', 'entity_id' => $this->courseId] : null,
        ];
    }
}