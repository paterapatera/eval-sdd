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
        $paginated = Announcement::latest()->paginate(3, ['title'], 'page', 1);

        $recentAnnouncements = array_map(
            fn (Announcement $announcement): array => [
                'title' => $announcement->title,
            ],
            $paginated->items(),
        );

        return Inertia::render('dashboard', [
            'recentAnnouncements' => $recentAnnouncements,
            'emptyMessage' => 'お知らせはありません',
        ]);
    }
}
