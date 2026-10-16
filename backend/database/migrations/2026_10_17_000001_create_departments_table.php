<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('external_id', 64)->unique();
            $table->foreignId('parent_id')->nullable()->constrained('departments')->restrictOnDelete();
            $table->string('name', 255);
            $table->string('source', 32)->default('onec_zup');
            $table->timestamp('synced_at', 0);
            $table->timestamps(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};