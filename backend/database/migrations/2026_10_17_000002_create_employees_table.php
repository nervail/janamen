<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('external_id', 64)->unique();
            $table->string('last_name', 100);
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('company', 255);
            $table->string('position', 255);
            $table->foreignId('department_id')->constrained('departments')->restrictOnDelete();
            $table->foreignId('manager_id')->nullable()->constrained('employees')->restrictOnDelete();
            $table->date('hired_at');
            $table->decimal('vacation_balance_days', 5, 2)->default(0);
            $table->string('source', 32)->default('onec_zup');
            $table->timestamp('synced_at', 0);
            $table->timestamps(0);

            $table->index('manager_id');
            $table->index('department_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};