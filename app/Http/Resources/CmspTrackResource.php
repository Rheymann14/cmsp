<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CmspTrackResource extends JsonResource
{
    public function toArray($request)
    {

          $latestValidation = $this->whenLoaded('latestValidation');
    $documentStatus   = $latestValidation->document_status ?? null;

    // YOUR rule: any validation row => under_review
    $hasValidation = (bool) ($this->validations_exists ?? $latestValidation);
    $isUnderReview = $hasValidation;

        // Build a readable address based on which set is filled
        $addr = $this->province_municipality
            ? [
                'scope' => 'Region XII',
                'province' => optional($this->location)->province,
                'municipality' => optional($this->location)->municipality,
                'barangay' => $this->barangay,
                'purok_street' => $this->purok_street,
                'zip_code' => $this->zip_code,
                'district' => optional($this->districtModel)->name,
              ]
            : [
                'scope' => 'BARMM',
                'province' => $this->barmm_province,
                'municipality' => $this->barmm_municipality,
                'barangay' => $this->barmm_barangay,
                'purok_street' => $this->barmm_purok_street,
                'zip_code' => $this->barmm_zip_code,
              ];

        // Minimal, non-sensitive snapshot
        $latestValidation = $this->whenLoaded('latestValidation');

        $isValidated = false;
        $documentStatus = null;
        if ($latestValidation) {
            $documentStatus = $latestValidation->document_status;
            $isValidated = strcasecmp($documentStatus ?? '', 'validated') === 0;
        }

        return [
            'tracking_no' => $this->tracking_no,
            'submitted_at' => $this->created_at?->toDateTimeString(),
            'incoming' => (bool) $this->incoming, // if you want to show a tag
            'latest_validation' => $latestValidation ? [
                'document_status' => $documentStatus,
            ] : null,
            'application_status' => [
            'key'   => $isUnderReview ? 'under_review' : 'submitted',
            'label' => $isUnderReview ? 'Application under review' : 'Submitted',
        ],

            'applicant' => [
                'name' => trim(collect([$this->first_name, $this->middle_name, $this->last_name, $this->name_extension])->filter()->implode(' ')),
                'birthdate' => $this->birthdate?->toDateString(),
                'sex' => $this->sex,
                'ethnicity' => optional($this->ethnicity)->label,
                'religion'  => optional($this->religion)->label,
            ],

            'academic' => [
                'academic_year' => $this->academic_year,
                'deadline' => $this->deadline?->toDateString(),
                'school' => [
                    'name' => optional($this->school)->name,
                    'type' => $this->school_type,
                ],
                'course' => optional($this->courseModel)->name,
                'year_level' => $this->year_level,
                'gad_stufaps_course' => $this->gad_stufaps_course,
                'gwa' => [
                    'g12_s1' => $this->gwa_g12_s1,
                    'g12_s2' => $this->gwa_g12_s2,
                ],
            ],

            'address' => $addr,

            'files' => [
                'application_form' => (bool) $this->application_form_path,
                'grades_g12_s1'    => (bool) $this->grades_g12_s1_path,
                'grades_g12_s2'    => (bool) $this->grades_g12_s2_path,
                'birth_certificate'=> (bool) $this->birth_certificate_path,
                'proof_of_income'  => (bool) $this->proof_of_income_path,
                'special_group'    => (bool) $this->proof_of_special_group_path,
                'guardianship'     => (bool) $this->guardianship_certificate_path,
            ],
        ];
    }
}
