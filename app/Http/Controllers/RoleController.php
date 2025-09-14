<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        // 1) Base query
        $query = User::query()->with(['region', 'roles']);

        // 2) Search
        if ($search = $request->input('search')) {
            $query->where(fn($q) =>
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
            );
        }

        // 3) Sort
        $sortBy  = $request->input('sortBy', 'id');
        $sortDir = $request->input('sortDir', 'asc');
        if ($sortBy === 'region') {
    // Join regions table for sorting
    $query->leftJoin('regions', 'users.region_id', '=', 'regions.id')
        ->orderBy('regions.region', $sortDir)
        ->select('users.*'); // Select only user columns to avoid ambiguous columns
} else {
    $query->orderBy($sortBy, $sortDir);
}

        // 4) Paginate & append filters to links
        $perPage = $request->input('perPage', 5);
        $users = $query
            ->paginate($perPage)
            ->appends($request->only(['search','sortBy','sortDir','perPage']));

        $userRegions = User::whereNotNull('region_id')->pluck('region_id')->unique();
        $regions = \App\Models\Region::where(function ($q) use ($userRegions) {
            $q->where('status', 'active')->orWhereIn('id', $userRegions);
        })->get(['id', 'region', 'status']);


        return Inertia::render('role_management', [
            'users'   => $users,
            'regions' => $regions,
            'roles'   => \App\Models\Role::orderBy('role')->get(['id', 'role', 'status']),
            'filters' => $request->only(['search','sortBy','sortDir','perPage']),
        ]);
    }

    /** 
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        // Validate input
        $validated = $request->validate([
        'name'  => ['required', 'string', 'max:255'],
        'email' => [
            'required',
            'string',
            'email',
            'max:255',
            Rule::unique('users', 'email'),
        ],
     
    ]);

        // Create user (default password, change as needed)
    $user = User::create([
    'name'     => $validated['name'],
    'email'    => $validated['email'],
    'password' => Hash::make('12345678'),
  
]);

if ($request->has('role_ids')) {
    $user->roles()->sync($request->input('role_ids'));
}

        // Redirect back with success (Inertia expects redirect)
        return redirect()->back()
            ->with('success', 'User created successfully!');
    }

    public function destroy(User $user)
    {
        $user->delete(); // soft delete
        return redirect()->back()->with('success', 'User deleted successfully!');
    }

public function update(Request $request, User $user)
{
    $validated = $request->validate([
        'name'  => ['required', 'string', 'max:255'],
        'email' => [
            'required',
            'string',
            'email',
            'max:255',
            Rule::unique('users')->ignore($user->id),
        ],
        'region_id' => [
            'nullable',
            'string',
            Rule::exists('regions', 'id'),
        ],
        'role_ids' => ['nullable', 'array'],
        'role_ids.*' => ['uuid', Rule::exists('roles', 'id')],
    ]);

    $user->update($validated);

    if ($request->has('role_ids')) {
        $user->roles()->sync($request->input('role_ids'));
    }

    $user->load('region', 'roles');

    return redirect()->back()->with('success', 'User updated successfully!');
}



    public function trashed(Request $request)
        {
            // Get only soft deleted users (use withTrashed() or onlyTrashed())
            $users = User::onlyTrashed()
                ->orderBy('deleted_at', 'desc')
                ->paginate(10)
                ->appends($request->all());

            return response()->json([
                'users' => $users
            ]);
        }

        public function restore($id)
        {
            $user = User::onlyTrashed()->findOrFail($id);
            $user->restore();
            return redirect()->back()->with('success', 'User restored!');
        }

 public function getRoles()
    {
        return response()->json([
            'roles' => Role::orderBy('role')->get(),
        ]);
    }

    public function storeRole(Request $request)
    {
        $validated = $request->validate([
            'role' => 'required|string|max:255|unique:roles,role',
        ]);

        $role = Role::create([
            'role' => $validated['role'],
            'status' => 'active',
        ]);

        // For Inertia, always return a redirect:
        return redirect()->back()->with('success', 'Role added!');
    }


    public function updateRoleStatus(Request $request, Role $role)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $role->status = $validated['status'];
        $role->save();

         return redirect()->back()->with('success', 'Role status updated!');
    }

    public function resetPassword(User $user)
{
    $user->update([
        'password' => Hash::make('12345678'),
    ]);

    return redirect()->back()->with('success', 'Password reset to default (12345678).');
}


}
