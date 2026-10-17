<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 64)->unique();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps(0);
        });

        Schema::create('chapters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->smallInteger('position');
            $table->string('title', 255);
            $table->text('content_md');
            $table->smallInteger('pass_threshold')->default(70);
            $table->timestamps(0);
            $table->unique(['course_id', 'position']);
        });

        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chapter_id')->constrained()->cascadeOnDelete();
            $table->smallInteger('position');
            $table->text('text');
        });

        Schema::create('options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->smallInteger('position');
            $table->string('text', 500);
            $table->boolean('is_correct')->default(false);
        });

        Schema::create('course_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('assigned_by')->constrained('users')->restrictOnDelete();
            $table->date('due_date')->nullable();
            $table->string('status', 16)->default('not_started');
            $table->smallInteger('progress_percent')->default(0);
            $table->timestamp('completed_at', 0)->nullable();
            $table->timestamps(0);
            $table->unique(['course_id', 'user_id']);
            $table->index('user_id');
        });

        Schema::create('chapter_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('course_assignments')->cascadeOnDelete();
            $table->foreignId('chapter_id')->constrained()->restrictOnDelete();
            $table->timestamp('material_viewed_at', 0)->nullable();
            $table->smallInteger('last_score')->nullable();
            $table->smallInteger('max_score')->nullable();
            $table->boolean('passed')->default(false);
            $table->smallInteger('attempts')->default(0);
            $table->timestamp('passed_at', 0)->nullable();
            $table->timestamps(0);
            $table->unique(['assignment_id', 'chapter_id']);
        });
    }

    public function down(): void
    {
        foreach (['chapter_progress', 'course_assignments', 'options', 'questions', 'chapters', 'courses'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};