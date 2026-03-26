<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
    Schema::create('cmsp_applications', function (Blueprint $table) {
            $table->id();

            $table->string('tracking_no', 10)->unique();

            $table->boolean('incoming');
            $table->string('lrn', 12);

            $table->string('email');
            $table->string('contact_number');
            $table->string('last_name');
            $table->string('first_name');
            $table->string('middle_name');
            $table->string('maiden_name')->nullable();
            $table->string('name_extension')->nullable();

            $table->date('birthdate');
            $table->unsignedTinyInteger('age')->nullable(); 
            $table->enum('sex', ['male','female']);

            // NEW: lookups
            $table->unsignedBigInteger('ethnicity_id');
            $table->unsignedBigInteger('religion_id');

            // Region XII address (nullable when BARMM used)
            $table->unsignedBigInteger('province_municipality')->nullable(); // ->constrained('locations') if you want
            $table->string('barangay')->nullable();
            $table->string('purok_street')->nullable();
            $table->string('zip_code', 12)->nullable();
            $table->unsignedBigInteger('district')->nullable(); // ->constrained('districts')

            // BARMM (nullable when Region XII used)
            $table->string('barmm_province')->nullable();
            $table->string('barmm_municipality')->nullable();
            $table->string('barmm_barangay')->nullable();
            $table->string('barmm_purok_street')->nullable();
            $table->string('barmm_zip_code', 12)->nullable();

            // Choices now as IDs
            $table->unsignedBigInteger('intended_school'); // ->constrained('schools')
            $table->enum('school_type', ['Public','LUC','Private']);
            $table->string('other_school')->nullable();
            $table->string('year_level');
            $table->unsignedBigInteger('course'); // ->constrained('courses')

            $table->string('gad_stufaps_course')->nullable();

            $table->string('shs_name');
            $table->string('shs_address');
            $table->enum('shs_school_type', ['Public', 'Private']);

            $table->string('father_name')->nullable();
            $table->string('father_occupation')->nullable();
            $table->integer('father_income_monthly')->nullable();
            $table->unsignedBigInteger('father_income_yearly_bracket')->nullable(); // CHANGED to numeric
            $table->boolean('father_na')->default(false);
            $table->boolean('father_deceased')->default(false);

            $table->string('mother_name')->nullable();
            $table->string('mother_occupation')->nullable();
            $table->integer('mother_income_monthly')->nullable();
            $table->unsignedBigInteger('mother_income_yearly_bracket')->nullable(); // CHANGED to numeric
            $table->boolean('mother_na')->default(false);
            $table->boolean('mother_deceased')->default(false);

            $table->string('guardian_name')->nullable();
            $table->string('guardian_occupation')->nullable();
            $table->integer('guardian_income_monthly')->nullable();

            // GWA — keep G12 S1, ADD G12 S2, remove G11
            $table->unsignedTinyInteger('gwa_g12_s1');
            $table->unsignedTinyInteger('gwa_g12_s2');

            $table->json('special_groups')->nullable();
            $table->boolean('consent')->default(false);

            // Files
            $table->string('application_form_path');
            $table->string('grades_g12_s1_path');
            $table->string('grades_g12_s2_path'); // NEW
            $table->string('birth_certificate_path');
            $table->string('proof_of_income_path');
            $table->string('proof_of_special_group_path')->nullable();
            $table->string('guardianship_certificate_path')->nullable();

            $table->string('academic_year');
            $table->date('deadline');

            // Optional
            // $table->boolean('working')->default(false);

            $table->timestamps();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('cmsp_applications');
    }
};
