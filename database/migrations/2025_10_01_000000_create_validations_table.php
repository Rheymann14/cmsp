<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('validations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cmsp_id')
                ->constrained('cmsp_applications')
                ->cascadeOnDelete()
                ->unique();
            $table->string('tracking_no', 10);
            $table->string('documentary_requirements');
            $table->foreignId('checked_by')->constrained('users')->restrictOnDelete();
            $table->string('remarks')->nullable();
            $table->timestamps();

            $table->index('tracking_no');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('validations');
    }
};
