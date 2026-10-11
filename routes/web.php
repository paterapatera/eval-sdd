<?php

use App\Http\Controllers\MemberProfileController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('members/{user}', [MemberProfileController::class, 'show'])->name('members.show');
});

require __DIR__.'/settings.php';
