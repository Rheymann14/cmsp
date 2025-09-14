<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'field' => 'required|file',
        ]);

        $path = $request->file('field')->store('attachments');

        Application::create([
            'attachment_path' => $path,
        ]);

        return response()->json(['path' => $path], 201);
    }
}
