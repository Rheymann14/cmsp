<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('validations', function (Blueprint $table) {
            $table->text('validator_notes')->nullable()->after('initial_rank');
            $table->string('remarks', 255)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('validations', function (Blueprint $table) {
            $table->dropColumn('validator_notes');
            $table->text('remarks')->nullable()->change();
        });
    }
};
