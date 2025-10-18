<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Location;

class LocationController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->ajax()) {
            abort(404);
        }

        $locations = Location::with('district')
            ->orderBy('province')
            ->orderBy('municipality')
            ->get()
            ->map(fn($loc) => [
                'id' => $loc->id,
                'label' => "{$loc->province} - {$loc->municipality}",
                'district_id' => $loc->district_id,
                'district_label' => optional($loc->district)->name,
            ]);

        if ($locations->isEmpty()) {
            return response()->json([
                'message' => 'No locations found',
                'data' => [],
            ], 200);
        }

        return response()->json([
            'message' => 'Locations retrieved successfully',
            'data' => $locations,
        ], 200);
    }
}
