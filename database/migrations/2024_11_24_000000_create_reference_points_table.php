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
        Schema::create('reference_points', function (Blueprint $table) {
            $table->id();
            $table->string('category');
            $table->decimal('range_from', 12, 2);
            $table->decimal('range_to', 12, 2)->nullable();
            $table->unsignedSmallInteger('equivalent_points');
            $table->timestamps();

            $table->index(['category', 'range_from']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reference_points');
    }
};
