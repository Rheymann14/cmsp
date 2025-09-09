<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Region;
use Inertia\Inertia;

class RegionController extends Controller
{
   public function index()
{
    // Return all regions, optionally paginate or order
    $regions = Region::orderBy('region')->get();
    return response()->json(['regions' => $regions]);
}

public function store(Request $request)
{
    $validated = $request->validate([
        'region' => ['required', 'string', 'max:255'],
    ]);

    $region = Region::create([
        'region' => $validated['region'],
        'status' => 'active',
    ]);

    return redirect()->back()->with('success', 'Region created!');
}

public function updateStatus(Request $request, Region $region)
{
    $validated = $request->validate([
        'status' => ['required', 'in:active,inactive'],
    ]);

    $region->update(['status' => $validated['status']]);
    return redirect()->back()->with('success', 'Region status updated!');
}

}
