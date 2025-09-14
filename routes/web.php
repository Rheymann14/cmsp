<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\RegionController;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\RegionMiddleware;
use App\Http\Middleware\EnsureActiveRoleAndRegion;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\DistrictController;
use App\Http\Controllers\SchoolController;
use App\Http\Controllers\CourseController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/api/locations', [LocationController::class, 'index']);
Route::get('/api/districts', [DistrictController::class, 'index']);
Route::get('/api/schools', [SchoolController::class, 'index']);
Route::get('/api/courses', [CourseController::class, 'index']);

Route::middleware(['auth', EnsureActiveRoleAndRegion::class])->group(function () {
    
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/role_management', [RoleController::class, 'index'])->middleware(RoleMiddleware::class.':Admin')
        ->name('role_management');

    Route::post('/role_management', [RoleController::class, 'store'])
        ->name('users.store');

    Route::delete('/role_management/{user}', [RoleController::class, 'destroy'])->name('users.destroy');
    Route::put('/role_management/{user}', [RoleController::class, 'update'])->name('users.update');

    Route::get('/role_management/trashed', [RoleController::class, 'trashed'])->name('users.trashed');
    Route::post('/role_management/{user}/restore', [RoleController::class, 'restore'])->name('users.restore');

    Route::post('/regions', [RegionController::class, 'store'])->name('regions.store');
    Route::get('/regions', [RegionController::class, 'index'])->name('regions.index');

    Route::patch('/regions/{region}/status', [RegionController::class, 'updateStatus'])
    ->name('regions.updateStatus');

    Route::get('/roles', [RoleController::class, 'getRoles'])->name('roles.index');
    Route::post('/roles', [RoleController::class, 'storeRole'])->name('roles.store');
    Route::patch('/roles/{role}/status', [RoleController::class, 'updateRoleStatus'])->name('roles.updateStatus');
    Route::post('/users/{user}/reset-password', [RoleController::class, 'resetPassword'])
    ->name('users.resetPassword');

    





});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
