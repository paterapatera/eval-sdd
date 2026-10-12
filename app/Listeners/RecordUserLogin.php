<?php

namespace App\Listeners;

use App\Models\LoginHistory;
use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Date;

class RecordUserLogin
{
    public function handle(Login $event): void
    {
        if (! $event->user instanceof User) {
            return;
        }

        LoginHistory::create([
            'user_id' => $event->user->id,
            'logged_at' => Date::now(),
            'ip_address' => request()->ip() ?? '0.0.0.0',
        ]);
    }
}
