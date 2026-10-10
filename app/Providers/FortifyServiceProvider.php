<?php

namespace App\Providers;

use App\Support\FortifyConfiguration;

class FortifyServiceProvider extends ApplicationServiceProvider
{
    protected function bootApplication(): void
    {
        (new FortifyConfiguration)->configure();
    }
}
