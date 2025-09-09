<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = Auth::user();

        // Ensure user has at least one matching active role
        $hasRole = $user?->roles()
            ->whereIn('role', $roles)
            ->where('status', 'active')
            ->exists();

        if (!$hasRole) {
           
            return redirect()->back()->with('toast_error', 'Unauthorized access (Role inactive or missing).');
        }

        return $next($request);
    }
}


