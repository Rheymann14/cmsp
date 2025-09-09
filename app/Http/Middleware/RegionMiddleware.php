<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RegionMiddleware
{
    public function handle(Request $request, Closure $next, $regionId = null)
    {
        $user = Auth::user();

        if (!$user || ($regionId && $user->region_id != $regionId)) {
            abort(403, 'Unauthorized region access.');
        }

        return $next($request);
    }
}
