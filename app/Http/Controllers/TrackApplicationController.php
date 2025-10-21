<?php

namespace App\Http\Controllers;

use App\Http\Resources\CmspTrackResource;
use App\Models\CmspApplication;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TrackApplicationController extends Controller
{
    public function show(Request $request, string $trackingNo)
    {
        // Normalize and validate tracking number
        $normalized = strtoupper($trackingNo);
        if (!preg_match('/^[A-Z0-9]{5}-\d{4}$/', $normalized)) {
            throw ValidationException::withMessages([
                'tracking_no' => 'Invalid tracking number format (AAAAA-YYYY).',
            ]);
        }

$app = CmspApplication::query()
    ->with([
        'ethnicity:id,label',
        'religion:id,label',
        'location:id,province,municipality',
        'districtModel:id,name',
        'school:id,name',
        'courseModel:id,name',
        'latestValidation' => function ($q) {
            // qualify columns to avoid ambiguity
            $q->select('validations.id', 'validations.cmsp_id', 'validations.document_status');
        },
    ])
    ->withExists('validations')  // adds boolean attribute: validations_exists
    ->where('tracking_no', $normalized)
    ->first();

        if (!$app) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return new CmspTrackResource($app);
    }
}
