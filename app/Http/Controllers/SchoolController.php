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
            ->unique(fn($s) => mb_strtolower(trim((string) $s->name)))
            ->values()
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
