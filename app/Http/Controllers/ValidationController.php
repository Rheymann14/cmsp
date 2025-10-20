<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreValidationRequest;
use App\Models\CmspApplication;
use App\Models\Validation;
use Illuminate\Http\RedirectResponse;

class ValidationController extends Controller
{
    public function store(StoreValidationRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $application = CmspApplication::findOrFail($data['cmsp_id']);

        Validation::create([
            'cmsp_id' => $application->id,
            'tracking_no' => $application->tracking_no,
            'documentary_requirements' => $data['documentary_requirements'],
            'checked_by' => $request->user()->id,
            'remarks' => $data['remarks'] ?? null,
        ]);

        return back()->with('success', 'Application validation saved successfully.');
    }
}
