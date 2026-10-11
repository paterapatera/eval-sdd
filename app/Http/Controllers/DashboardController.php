<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function __invoke(Request $request): Response
    {
        $titles = DB::table('announcements')
            ->orderByDesc('created_at')
            ->limit(3)
            ->pluck('title');

        $recentAnnouncements = array_map(
            static fn (string $title): array => ['title' => $title],
            $titles->all(),
        );

        return Inertia::render('dashboard', [
            'recentAnnouncements' => $recentAnnouncements,
            'emptyMessage' => 'お知らせはありません',
        ]);
    }
}
