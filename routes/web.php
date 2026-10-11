<?php

use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('announcements', [AnnouncementController::class, 'index'])->name('announcements');
});

require __DIR__.'/settings.php';
