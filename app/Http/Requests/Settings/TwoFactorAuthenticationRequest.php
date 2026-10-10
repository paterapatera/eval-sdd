<?php

namespace App\Http\Requests\Settings;

use Laravel\Fortify\InteractsWithTwoFactorState;

class TwoFactorAuthenticationRequest extends SettingsFormRequest
{
    use InteractsWithTwoFactorState;
}
