<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->jsonb('data');
            $table->timestamp('read_at', 0)->nullable();
            // миллисекунды, чтобы порядок уведомлений в одной цепочке был стабильным
            $table->timestamps(3);
        });

        DB::statement('create index notifications_unread_idx on notifications (notifiable_id) where read_at is null');
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};