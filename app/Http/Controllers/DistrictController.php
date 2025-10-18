<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\District;
use App\Models\Location;

class DistrictController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->ajax()) {
            abort(404);
        }

        $locationId = $request->query('location_id');
        if ($locationId !== null) {
            $location = Location::find((int) $locationId);

            if (!$location) {
                return response()->json([
                    'message' => 'No districts found for the selected location',
                    'data' => [],
                ], 200);
            }

            $districts = Location::where('province', $location->province)
                ->whereNotNull('district_id')
                ->with('district')
                ->get()
                ->pluck('district')
                ->filter()
                ->unique('id')
                ->sortBy('name')
                ->values()
                ->map(fn($d) => [
                    'id' => $d->id,
                    'label' => $d->name,
                ]);

            if ($districts->isEmpty()) {
                return response()->json([
                    'message' => 'No districts found for the selected location',
                    'data' => [],
                ], 200);
            }

            return response()->json([
                'message' => 'Districts retrieved successfully',
                'data' => $districts,
            ], 200);
        }

        $districts = District::orderBy('name')
            ->get()
            ->map(fn($d) => [
                'id' => $d->id,
                'label' => $d->name,
            ]);

        if ($districts->isEmpty()) {
            return response()->json([
                'message' => 'No districts found',
                'data' => [],
            ], 200);
        }

        return response()->json([
            'message' => 'Districts retrieved successfully',
            'data' => $districts,
        ], 200);
    }
}
