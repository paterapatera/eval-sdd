<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoginHistoryController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $entries = $user->loginHistories()
            ->orderByDesc('logged_at')
            ->limit(10)
            ->get()
            ->map(fn ($history) => [
                'loggedAt' => $history->logged_at
                    ->timezone('Asia/Tokyo')
                    ->format('Y-m-d H:i'),
                'ipAddress' => $history->ip_address,
            ])
            ->values()
            ->all();

        return Inertia::render('settings/login-history', [
            'entries' => $entries,
            'isEmpty' => $entries === [],
        ]);
    }
}
