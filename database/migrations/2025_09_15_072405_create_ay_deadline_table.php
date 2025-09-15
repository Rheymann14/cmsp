<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ay_deadline', function (Blueprint $table) {
            $table->id();
            $table->string('academic_year'); // e.g. "2025–2026"
            $table->date('deadline');        // e.g. "2025-06-20"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ay_deadline');
    }
};
