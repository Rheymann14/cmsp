<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cmsp_applications', function (Blueprint $table) {
            $table->enum('shs_school_type', ['Public', 'Private'])->after('shs_address');
        });
    }

    public function down(): void
    {
        Schema::table('cmsp_applications', function (Blueprint $table) {
            $table->dropColumn('shs_school_type');
        });
    }
};
