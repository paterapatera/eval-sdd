<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;

class PasswordUpdateRequest extends ConfirmsCurrentPasswordRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->updatePasswordFormRules();
    }
}
