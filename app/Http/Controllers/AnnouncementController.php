<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of announcements.
     */
    public function index(Request $request): Response
    {
        $announcements = Announcement::query()
            ->latest()
            ->paginate(20)
            ->through(fn (Announcement $announcement): array => [
                'title' => $announcement->title,
                'body' => $announcement->body,
                'publishedOn' => $announcement->created_at
                    ?->timezone(config('app.timezone'))
                    ->format('Y-m-d') ?? '',
            ]);

        return Inertia::render('announcements', [
            'announcements' => $announcements,
            'emptyMessage' => 'お知らせはありません',
        ]);
    }
}
