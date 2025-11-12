<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $shared = parent::share($request);
        $baseFlash = $shared['flash'] ?? [];

        return [
            ...$shared,
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'profile_photo_path' => $request->user()->profile_photo_path,
                    'profile_photo_url' => $request->user()->profile_photo_url,
                    'roles' => $request->user()->roles()
                        ->select('roles.id', 'roles.role', 'roles.status')
                        ->get(),
                ] : null,
                
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => function () use ($baseFlash, $request) {
                $resolved = $baseFlash;

                if ($resolved instanceof \Closure) {
                    $resolved = $resolved();
                }

                if (! is_array($resolved)) {
                    $resolved = [];
                }

                $tracking = $request->session()->get('tracking_no');

                return [
                    ...$resolved,
                    'tracking_no' => $tracking,
                    'trackingNo' => $tracking,
                ];
            },
        ];
    }
}
