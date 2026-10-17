<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('kb_documents', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 64);
            $table->string('language', 2);
            $table->string('title', 255);
            $table->string('access_level', 16);
            $table->smallInteger('position');
            $table->timestamps(0);
            $table->unique(['slug', 'language']);
        });

        Schema::create('kb_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('kb_documents')->cascadeOnDelete();
            $table->string('key', 128)->unique();
            $table->string('anchor', 64);
            $table->string('title', 255);
            $table->text('body');
            $table->smallInteger('position');
        });

        Schema::create('ai_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('locale', 2);
            $table->text('question');
            $table->text('answer')->nullable();
            $table->string('result', 32);
            $table->jsonb('source_keys');
            $table->foreignId('escalated_request_id')->nullable()->constrained('requests')->restrictOnDelete();
            $table->string('model', 64)->nullable();
            $table->integer('latency_ms')->nullable();
            $table->smallInteger('rating')->nullable();
            $table->timestamp('created_at', 0)->useCurrent();
            $table->index('user_id');
            $table->index('result');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('kb_sections');
        Schema::dropIfExists('kb_documents');
    }
};