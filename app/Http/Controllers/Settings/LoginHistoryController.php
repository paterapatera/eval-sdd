<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\LoginHistory;
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

        $user->load('loginHistories');

        $entries = $user->loginHistories
            ->sortByDesc('logged_at')
            ->take(10)
            ->map(static fn (LoginHistory $history) => [
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
