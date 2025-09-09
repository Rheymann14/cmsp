<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveRoleAndRegion
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user) {
            $user->load('roles', 'region');

            // ✅ Check if user has roles
            if ($user->roles->isEmpty()) {
                Auth::logout();
                return redirect()->route('login')->withErrors([
                    'email' => 'No Role Assigned. Contact the administrator.'
                ]);
            }

            // ✅ Check for at least one active role
            if (!$user->roles->contains(fn($role) => $role->status === 'active')) {
                Auth::logout();
                return redirect()->route('login')->withErrors([
                    'email' => 'Inactive Role. Contact the administrator.'
                ]);
            }

            // ✅ Check if region is inactive (optional)
            if ($user->region && $user->region->status === 'inactive') {
                Auth::logout();
                return redirect()->route('login')->withErrors([
                    'email' => 'Inactive Region. Contact the administrator.'
                ]);
            }
        }

        return $next($request);
    }
}
