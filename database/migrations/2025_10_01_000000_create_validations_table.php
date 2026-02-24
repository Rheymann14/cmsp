<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('validations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cmsp_id')->constrained('cmsp_applications')->cascadeOnDelete();
            $table->string('tracking_no', 12);
            $table->string('document_status');
            $table->unsignedTinyInteger('no_siblings');
            $table->string('initial_rank', 40);
            $table->text('validator_notes')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('checked_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index('tracking_no');
            $table->unique('cmsp_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('validations');
    }
};
