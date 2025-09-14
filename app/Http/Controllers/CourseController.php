<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->ajax()) {
            abort(404);
        }

        $courses = Course::orderBy('name')
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'label' => $c->name,
           
            ]);

        return response()->json([
            'message' => $courses->isEmpty()
                ? 'No courses found'
                : 'Courses retrieved successfully',
            'data' => $courses,
        ]);
    }
}
