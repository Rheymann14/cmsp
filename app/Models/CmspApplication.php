<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmspApplication extends Model
{
    protected $fillable = [
        'incoming','lrn','email','contact_number','last_name','first_name','middle_name',
        'maiden_name','name_extension','birthdate','sex','province_municipality','barangay',
        'purok_street','zip_code','district','intended_school','school_type','other_school',
        'year_level','course','shs_name','shs_address','father_name','father_occupation',
        'father_income_monthly','father_income_yearly_bracket','mother_name','mother_occupation',
        'mother_income_monthly','mother_income_yearly_bracket','guardian_name','guardian_occupation',
        'guardian_income_monthly','gwa_g11_s1','gwa_g11_s2','gwa_g12_s1','special_groups',
        'consent','application_form_path', 'grades_g11_s1_path','grades_g11_s2_path','grades_g12_s1_path',
        'birth_certificate_path','proof_of_income_path',
        'proof_of_special_group_path','guardianship_certificate_path', 'academic_year', 'deadline',
    ];

    protected $casts = [
        'incoming' => 'boolean',
        'consent' => 'boolean',
        'birthdate' => 'date',
        'special_groups' => 'array',
    ];
}
