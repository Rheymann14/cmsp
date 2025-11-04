<?php

namespace App\Http\Controllers;

use App\Models\AyDeadline;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    public function index()
    {
        $activeDeadline = AyDeadline::query()
            ->where('is_enabled', true)
            ->latest()
            ->first();

        $ayDeadline = $activeDeadline ?? AyDeadline::latest()->first();

        return Inertia::render('welcome', [
            'ayDeadline' => $ayDeadline,
        ]);
    }
}
