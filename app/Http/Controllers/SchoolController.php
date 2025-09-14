<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\School;

class SchoolController extends Controller
{
    public function index(Request $request)
    {
        // Block direct browser hits unless it's AJAX/fetch
        if (!$request->ajax()) {
            abort(404);
        }

        $schools = School::orderBy('name')
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'label' => $s->name,
            ]);

        return response()->json([
            'message' => $schools->isEmpty()
                ? 'No schools found'
                : 'Schools retrieved successfully',
            'data' => $schools,
        ], 200);
    }
}
