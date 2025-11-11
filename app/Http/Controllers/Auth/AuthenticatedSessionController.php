<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::user()->load('roles', 'region');

        if ($user->roles->isEmpty()) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'No Role Assigned. Contact the administrator.'
                ]);
            }

        $activeRole = $user->roles->firstWhere('status', 'active');
            if (!$activeRole) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Inactive Role. Contact the administrator.'
                ]);
            }

            if ($user->region && $user->region->status === 'inactive') {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Inactive Region. Contact the administrator.'
                ]);
            }

        return redirect()->intended(route('raw_list', absolute: false));
    }



        /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Inertia::location('/');
    }


}
