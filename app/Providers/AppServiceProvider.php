<?php

namespace App\Providers;

use App\Concerns\ConfiguresApplicationDefaults;

class AppServiceProvider extends ApplicationServiceProvider
{
    use ConfiguresApplicationDefaults;

    protected function bootApplication(): void
    {
        $this->configureApplicationDefaults();
    }
}
