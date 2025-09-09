<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Role; // ✅ Import Role model
use Illuminate\Support\Facades\Hash;

class CreateSuperAdmin extends Command
{
    protected $signature = 'make:superadmin';
    protected $description = 'Create a superadmin (Admin role) user account';

    public function handle()
    {
        $name = $this->ask('Name');
        $email = $this->ask('Email');
        $password = $this->secret('Password');

        // ✅ Validate email uniqueness
        if (User::where('email', $email)->exists()) {
            $this->error('A user with this email already exists.');
            return 1;
        }

        // ✅ Ensure the Admin role exists, or create it if missing
        $adminRole = Role::firstOrCreate(
            ['role' => 'Admin'],
            ['status' => 'active']
        );

        // ✅ Create user
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
        ]);

        // ✅ Attach Admin role to the user
        $user->roles()->attach($adminRole->id);

        $this->info("Superadmin (Admin role) user created successfully!");
        $this->line("Name: $name");
        $this->line("Email: $email");
        $this->line("Role: Admin (Active)");

        return 0;
    }
}
