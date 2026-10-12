<?php

namespace App\Providers;

use App\Concerns\ConfiguresApplicationDefaults;
use App\Listeners\RecordUserLogin;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;

class AppServiceProvider extends ApplicationServiceProvider
{
    use ConfiguresApplicationDefaults;

    protected function bootApplication(): void
    {
        $this->configureApplicationDefaults();

        Event::listen(Login::class, RecordUserLogin::class);
    }
}
