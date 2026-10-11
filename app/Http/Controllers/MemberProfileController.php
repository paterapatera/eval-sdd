<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Config;
use Inertia\Inertia;
use Inertia\Response;

class MemberProfileController extends Controller
{
    /**
     * Display another member's public profile.
     */
    public function show(User $user): Response
    {
        return Inertia::render('members/show', [
            'member' => [
                'id' => $user->id,
                'name' => $user->name,
                'bioDisplay' => filled($user->bio) ? $user->bio : '自己紹介はまだありません',
                'memberSinceLabel' => $this->memberSinceLabel($user->created_at),
            ],
        ]);
    }

    private function memberSinceLabel(?CarbonInterface $createdAt): string
    {
        if ($createdAt === null) {
            return '';
        }

        return $createdAt->timezone(Config::string('app.timezone'))->format('Y年n月から利用');
    }
}
