<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Http\Requests\Settings\PhotoUpdateRequest;
use Illuminate\Support\Facades\Storage;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status'          => $request->session()->get('status'),
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        // handle name/email (and photo if present)
        if ($request->hasFile('photo')) {
            $this->storePhoto($request, $user);
        }

        $user->fill($request->validated());
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }
        $user->save();

        return to_route('profile.edit');
    }

    // NEW: only photo, no name/email validation
    public function updatePhoto(PhotoUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $this->storePhoto($request, $user);
        $user->save();

        return to_route('profile.edit');
    }

    // DRY extraction
    protected function storePhoto(PhotoUpdateRequest $request, $user)
    {
        $path = $request->file('photo')
                        ->store('profile-photos', 'public');

        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }

        $user->profile_photo_path = $path;
    }

    public function destroyPhoto(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
            $user->profile_photo_path = null;
            $user->save();
        }
        return to_route('profile.edit');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password']]);

        $user = $request->user();
        Auth::logout();
        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
