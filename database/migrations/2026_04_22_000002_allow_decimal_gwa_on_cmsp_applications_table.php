<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cmsp_applications', function (Blueprint $table) {
            $table->decimal('gwa_g12_s1', 5, 2)->change();
            $table->decimal('gwa_g12_s2', 5, 2)->change();
        });
    }

    public function down(): void
    {
        Schema::table('cmsp_applications', function (Blueprint $table) {
            $table->unsignedTinyInteger('gwa_g12_s1')->change();
            $table->unsignedTinyInteger('gwa_g12_s2')->change();
        });
    }
};
