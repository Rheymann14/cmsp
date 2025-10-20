<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class CmspApplication extends Model
{
   protected $fillable = [
        // Core / identity
        'tracking_no',
        'incoming','lrn','email','contact_number',
        'last_name','first_name','middle_name','maiden_name','name_extension',
        'birthdate','sex',

        // NEW foreign IDs
        'ethnicity_id','religion_id',

        // Address (Region XII) – nullable if BARMM is used
        'province_municipality','barangay','purok_street','zip_code','district',

        // Address (BARMM)
        'barmm_province','barmm_municipality','barmm_barangay','barmm_purok_street','barmm_zip_code',

        // School choices (IDs now)
        'intended_school','school_type','other_school','year_level','course',

        // Optional memo dropdown
        'gad_stufaps_course',

        // SHS
        'shs_name','shs_address','shs_school_type',


        // Parents/guardian
        'father_name','father_occupation','father_income_monthly','father_income_yearly_bracket',
        'mother_name','mother_occupation','mother_income_monthly','mother_income_yearly_bracket',
        'father_na','father_deceased','mother_na','mother_deceased',
        'guardian_name','guardian_occupation','guardian_income_monthly',

        // GWA (G12 only now)
        'gwa_g12_s1','gwa_g12_s2',

        // Consent & special groups
        'special_groups','consent',

        // File paths (G12 S2 added, G11 removed)
        'application_form_path',
        'grades_g12_s1_path','grades_g12_s2_path',
        'birth_certificate_path','proof_of_income_path',
        'proof_of_special_group_path','guardianship_certificate_path',

        // Meta
        'academic_year','deadline',

        // Optional: 'working',
    ];

    protected $casts = [
        'incoming'  => 'boolean',
        'consent'   => 'boolean',
        'birthdate' => 'date',
        'deadline'  => 'date',
        'special_groups' => 'array',

        // IDs / numerics
        'ethnicity_id' => 'integer',
        'religion_id'  => 'integer',
        'province_municipality' => 'integer',
        'district' => 'integer',
        'intended_school' => 'integer',
        'course' => 'integer',

        'father_income_monthly' => 'integer',
        'mother_income_monthly' => 'integer',
        'guardian_income_monthly' => 'integer',
        'father_income_yearly_bracket' => 'integer',
        'mother_income_yearly_bracket' => 'integer',
        'father_na' => 'boolean',
        'father_deceased' => 'boolean',
        'mother_na' => 'boolean',
        'mother_deceased' => 'boolean',

        'gwa_g12_s1' => 'integer',
        'gwa_g12_s2' => 'integer',

        // 'working' => 'boolean',
    ];

        protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            if ($model->birthdate) {
                $model->age = Carbon::parse($model->birthdate)->age;
            }
        });
    }


public function ethnicity()      { return $this->belongsTo(\App\Models\Ethnicity::class, 'ethnicity_id'); }
public function religion()       { return $this->belongsTo(\App\Models\Religion::class,  'religion_id'); }
public function location()       { return $this->belongsTo(\App\Models\Location::class,  'province_municipality'); }
public function districtModel()  { return $this->belongsTo(\App\Models\District::class,  'district'); }
public function school()         { return $this->belongsTo(\App\Models\School::class,    'intended_school'); }
public function courseModel()    { return $this->belongsTo(\App\Models\Course::class,    'course'); }

// Backwards-compatible aliases (older relationship names used elsewhere)
public function districtR()      { return $this->districtModel(); }
public function courseR()        { return $this->courseModel(); }

public function validations()
{
    return $this->hasMany(Validation::class, 'cmsp_id');
}

    
}
