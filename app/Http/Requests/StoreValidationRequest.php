<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreValidationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'cmsp_id' => ['required', 'integer', 'exists:cmsp_applications,id'],
            'document_status' => ['required', 'string', 'max:255'],
            'no_siblings' => ['required', 'integer', 'between:1,20'],
            'initial_rank' => ['required', 'string', Rule::in(['FPESFA', 'FPESFA-GAD', 'FSSP', 'HPESFA', 'HPGAD', 'HSSP'])],
            'validator_notes' => ['nullable', 'string', 'max:2000'],
            'remarks' => ['nullable', 'string', 'max:255'],
        ];
    }
}
