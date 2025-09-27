<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cmsp_applications', function (Blueprint $table) {
            $table->id();

            // Core flags/ids
            $table->boolean('incoming'); // true if "yes"
            $table->string('lrn', 12);

            // Contact / identity
            $table->string('email');
            $table->string('contact_number');
            $table->string('last_name');
            $table->string('first_name');
            $table->string('middle_name');
            $table->string('maiden_name')->nullable();
            $table->string('name_extension')->nullable();

            // Demographics
            $table->date('birthdate');
            $table->enum('sex', ['male', 'female']);

            // Address
            $table->string('province_municipality');
            $table->string('barangay');
            $table->string('purok_street');
            $table->string('zip_code', 12)->nullable();
            $table->string('district');


                 // Address for BARMM B applicants (optional)
            $table->string('barmm_province')->nullable();
            $table->string('barmm_municipality')->nullable();
            $table->string('barmm_barangay')->nullable();
            $table->string('barmm_purok_street')->nullable();
            $table->string('barmm_zip_code', 12)->nullable();



            // Education choices
            $table->string('intended_school');
            $table->enum('school_type', ['Public','LUC','Private']);
            $table->string('other_school')->nullable();
            $table->string('year_level');
            $table->string('course');

            // CHED Memorandum dropdown (optional)
            $table->string('gad_stufaps_course')->nullable();

            // Senior High School
            $table->string('shs_name');
            $table->string('shs_address');

            // Parents / guardian
            $table->string('father_name');
            $table->string('father_occupation');
            $table->integer('father_income_monthly');
            $table->string('father_income_yearly_bracket');

            $table->string('mother_name');
            $table->string('mother_occupation');
            $table->integer('mother_income_monthly');
            $table->string('mother_income_yearly_bracket');

            $table->string('guardian_name');
            $table->string('guardian_occupation');
            $table->integer('guardian_income_monthly');

            // Academic performance
            $table->unsignedTinyInteger('gwa_g11_s1');
            $table->unsignedTinyInteger('gwa_g11_s2');
            $table->unsignedTinyInteger('gwa_g12_s1');

      

            // Checkboxes
            $table->json('special_groups')->nullable();

            // Consent
            $table->boolean('consent')->default(false);

            // Files (paths under storage/app/attachments)
            $table->string('application_form_path');

            // RequiredDocuments
            $table->string('grades_g11_s1_path');
            $table->string('grades_g11_s2_path');
            $table->string('grades_g12_s1_path');
            $table->string('birth_certificate_path');
            $table->string('proof_of_income_path');
            $table->string('proof_of_special_group_path')->nullable();
            $table->string('guardianship_certificate_path')->nullable();
            
            $table->string('academic_year');
            $table->date('deadline');
            

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cmsp_applications');
    }
};
