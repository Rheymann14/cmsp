<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'documentary_requirements' => ['required', 'string', 'max:255'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
