<?php

namespace App\Concerns;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Password;

trait PasswordValidationRules
{
    /**
     * Get the validation rules used to validate passwords.
     *
     * @return array<int, Password|ValidationRule|array<mixed>|string>
     */
    protected function passwordRules(): array
    {
        return ['required', 'string', Password::default(), 'confirmed'];
    }

    /**
     * Get the validation rules used to validate the current password.
     *
     * @return array<int, Password|ValidationRule|array<mixed>|string>
     */
    protected function currentPasswordRules(): array
    {
        return ['required', 'string', 'current_password'];
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function currentPasswordFieldRules(string $attribute = 'password'): array
    {
        return [
            $attribute => $this->currentPasswordRules(),
        ];
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function updatePasswordFormRules(): array
    {
        return [
            ...$this->currentPasswordFieldRules('current_password'),
            'password' => $this->passwordRules(),
        ];
    }
}
