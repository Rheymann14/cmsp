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
            if (!Schema::hasColumn('ay_deadline', 'new_slots')) {
                if (Schema::hasColumn('ay_deadline', 'is_enabled')) {
                    $table->unsignedInteger('new_slots')->default(0)->after('is_enabled');
                } else {
                    $table->unsignedInteger('new_slots')->default(0)->after('deadline');
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ay_deadline', function (Blueprint $table) {
            if (Schema::hasColumn('ay_deadline', 'new_slots')) {
                $table->dropColumn('new_slots');
            }
        });
    }
};
