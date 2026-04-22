<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('validations', function (Blueprint $table) {
            $table->string('qualification_status', 40)->nullable()->after('remarks');
            $table->json('disqualification_reasons')->nullable()->after('qualification_status');
        });
    }

    public function down(): void
    {
        Schema::table('validations', function (Blueprint $table) {
            $table->dropColumn(['qualification_status', 'disqualification_reasons']);
        });
    }
};
