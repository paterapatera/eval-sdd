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
        $recentAnnouncements = [];

        foreach (Announcement::latest()->get(['title'])->take(3) as $announcement) {
            $recentAnnouncements[] = [
                'title' => $announcement->title,
            ];
        }

        return Inertia::render('dashboard', [
            'recentAnnouncements' => $recentAnnouncements,
            'emptyMessage' => 'お知らせはありません',
        ]);
    }
}
