<?php

namespace App\Http\Controllers;

use App\Models\ReferencePoint;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReferencePointController extends Controller
{
    public function index(): Response
    {
        $gradePoints = ReferencePoint::query()
            ->where('category', ReferencePoint::CATEGORY_GRADE)
            ->orderBy('range_from')
            ->get()
            ->map(fn (ReferencePoint $point) => [
                'id' => $point->id,
                'range_from' => (float) $point->range_from,
                'range_to' => $point->range_to !== null ? (float) $point->range_to : null,
                'equivalent_points' => (int) $point->equivalent_points,
            ]);

        $incomePoints = ReferencePoint::query()
            ->where('category', ReferencePoint::CATEGORY_INCOME)
            ->orderBy('range_from')
            ->get()
            ->map(fn (ReferencePoint $point) => [
                'id' => $point->id,
                'range_from' => (float) $point->range_from,
                'range_to' => $point->range_to !== null ? (float) $point->range_to : null,
                'equivalent_points' => (int) $point->equivalent_points,
            ]);

        return Inertia::render('reference', [
            'gradePoints' => $gradePoints,
            'incomePoints' => $incomePoints,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer', Rule::exists('reference_points', 'id')],
            'items.*.equivalent_points' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        foreach ($validated['items'] as $item) {
            ReferencePoint::query()
                ->whereKey($item['id'])
                ->update(['equivalent_points' => $item['equivalent_points']]);
        }

        return redirect()->back()->with('success', 'Reference points updated successfully.');
    }
}
