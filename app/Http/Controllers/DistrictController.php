<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;

use App\Models\District;

class DistrictController extends Controller
{
    public function index(Request $request)
    {

         if (!$request->ajax()) {
        abort(404); // or abort(403)
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
