<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('requests', function (Blueprint $table) {
            $table->id();
            $table->string('type', 32);
            $table->foreignId('author_id')->constrained('users')->restrictOnDelete();
            $table->string('status', 32);
            $table->jsonb('payload');
            $table->timestamps(0);

            $table->index(['author_id', 'status']);
            $table->index(['type', 'status']);
        });

        Schema::create('request_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('requests')->restrictOnDelete();
            $table->string('from_status', 32)->nullable();
            $table->string('to_status', 32);
            $table->string('action', 32);
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->text('comment')->nullable();
            $table->timestamp('created_at', 0)->useCurrent();

            $table->index('request_id');
            $table->index(['request_id', 'actor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_status_history');
        Schema::dropIfExists('requests');
    }
};