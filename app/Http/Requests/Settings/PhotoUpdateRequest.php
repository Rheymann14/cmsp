<?php
namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class PhotoUpdateRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'photo' => ['required', 'image', 'max:2048'],
        ];
    }
}
