<?php

namespace App\Http\Controllers;

use App\Models\AyDeadline;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    public function index()
    {
        $ayDeadline = AyDeadline::latest()->first();

        return Inertia::render('welcome', [
            'ayDeadline' => $ayDeadline,
        ]);
    }
}
