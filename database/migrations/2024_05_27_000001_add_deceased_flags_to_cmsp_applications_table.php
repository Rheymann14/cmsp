<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cmsp_applications', function (Blueprint $table) {
            if (!Schema::hasColumn('cmsp_applications', 'father_deceased')) {
                $table->boolean('father_deceased')->default(false)->after('father_na');
            }

            if (!Schema::hasColumn('cmsp_applications', 'mother_deceased')) {
                $table->boolean('mother_deceased')->default(false)->after('mother_na');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cmsp_applications', function (Blueprint $table) {
            if (Schema::hasColumn('cmsp_applications', 'father_deceased')) {
                $table->dropColumn('father_deceased');
            }

            if (Schema::hasColumn('cmsp_applications', 'mother_deceased')) {
                $table->dropColumn('mother_deceased');
            }
        });
    }
};
