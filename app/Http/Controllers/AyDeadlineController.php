<?php

namespace App\Http\Controllers;

use App\Models\AyDeadline;
use Illuminate\Http\Request;

class AyDeadlineController extends Controller
{
    public function index()
    {
        $deadlines = AyDeadline::orderByDesc('deadline')->get()->map(function (AyDeadline $deadline) {
            return [
                'id' => $deadline->id,
                'academic_year' => $deadline->academic_year,
                'deadline' => optional($deadline->deadline)->toDateString(),
                'deadline_formatted' => $deadline->deadline_formatted,
                'is_enabled' => (bool) $deadline->is_enabled,
            ];
        });

        return response()->json(['deadlines' => $deadlines]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_year' => ['required', 'string', 'max:255'],
            'deadline' => ['required', 'date'],
        ]);

        AyDeadline::create([
            'academic_year' => $validated['academic_year'],
            'deadline' => $validated['deadline'],
            'is_enabled' => false,
        ]);

        return redirect()->back()->with('success', 'Academic year deadline created!');
    }

    public function update(Request $request, AyDeadline $ayDeadline)
    {
        $validated = $request->validate([
            'academic_year' => ['required', 'string', 'max:255'],
            'deadline' => ['required', 'date'],
        ]);

        $ayDeadline->update($validated);

        return redirect()->back()->with('success', 'Academic year deadline updated!');
    }

    public function updateStatus(Request $request, AyDeadline $ayDeadline)
    {
        $validated = $request->validate([
            'is_enabled' => ['required', 'boolean'],
        ]);

        $ayDeadline->update(['is_enabled' => $validated['is_enabled']]);

        return redirect()->back()->with('success', 'Academic year deadline status updated!');
    }
}
