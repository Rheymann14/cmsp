<?php

namespace App\Http\Controllers;

use App\Models\Ethnicity;
use Illuminate\Http\Request;

class EthnicityController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $items = Ethnicity::query()
            ->where('is_active', true)
            ->when($q !== '', fn($qb) =>
                $qb->where('label', 'like', '%'.$q.'%')
            )
            ->orderBy('label')
            ->get(['id', 'label']);

        return response()->json([
            'data' => $items,
        ]);
    }
}
