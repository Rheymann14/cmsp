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
        Schema::table('ay_deadline', function (Blueprint $table) {
            if (!Schema::hasColumn('ay_deadline', 'is_enabled')) {
                $table->boolean('is_enabled')->default(true)->after('deadline');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ay_deadline', function (Blueprint $table) {
            if (Schema::hasColumn('ay_deadline', 'is_enabled')) {
                $table->dropColumn('is_enabled');
            }
        });
    }
};
