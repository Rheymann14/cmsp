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
        Schema::table('users', function (Blueprint $table) {
       
            // nullable string to store the path of the uploaded image
            $table->string('profile_photo_path')->nullable()->after('email_verified_at');
            $table->string('region_id')->nullable()->after('password');
            $table->softDeletes();

     
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
          
            $table->dropColumn('profile_photo_path');
            $table->dropColumn('region_id');
            $table->dropSoftDeletes();

      
        });
    }
};
