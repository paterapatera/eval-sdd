<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

abstract class ApplicationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    abstract protected function bootApplication(): void;

    public function boot(): void
    {
        $this->bootApplication();
    }
}
