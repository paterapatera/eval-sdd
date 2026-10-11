<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function __invoke(Request $request): Response
    {
        $recentAnnouncements = Announcement::query()
            ->latest()
            ->limit(3)
            ->get(['title'])
            ->map(fn (Announcement $announcement): array => [
                'title' => $announcement->title,
            ])
            ->all();

        return Inertia::render('dashboard', [
            'recentAnnouncements' => $recentAnnouncements,
            'emptyMessage' => 'お知らせはありません',
        ]);
    }
}
