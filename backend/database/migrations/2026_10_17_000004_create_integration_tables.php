<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('integration_logs', function (Blueprint $table) {
            $table->id();
            $table->string('system', 32);
            $table->string('direction', 8);
            $table->string('operation', 64);
            $table->string('entity_type', 64)->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('status', 16);
            $table->string('message', 500);
            $table->jsonb('payload')->nullable();
            $table->timestamp('created_at', 0)->useCurrent();

            $table->index(['system', 'created_at']);
        });

        Schema::create('mock_onec_employees', function (Blueprint $table) {
            $table->id();
            $table->string('external_id', 64)->unique();
            $table->jsonb('data');
            $table->decimal('vacation_balance_days', 5, 2);
            $table->timestamp('updated_at', 0)->useCurrent();
        });

        Schema::create('mock_onec_vacation_orders', function (Blueprint $table) {
            $table->id();
            $table->string('employee_external_id', 64);
            $table->unsignedBigInteger('request_id');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('days', 5, 2);
            $table->timestamp('created_at', 0)->useCurrent();

            $table->foreign('employee_external_id')->references('external_id')->on('mock_onec_employees');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mock_onec_vacation_orders');
        Schema::dropIfExists('mock_onec_employees');
        Schema::dropIfExists('integration_logs');
    }
};