<?php

use App\Models\User;

it('shows email verification notice after changing email when opening security settings', function () {
    $user = User::factory()->create([
        'email' => 'verified-browser@example.com',
    ]);

    $page = visit('/login');

    $page->fill('email', $user->email)
        ->fill('password', 'password')
        ->click('Log in')
        ->assertPathIs('/dashboard');

    visit('/settings/profile')
        ->fill('email', 'changed-browser@example.com')
        ->click('Save');

    visit('/settings/security')
        ->assertPathIs('/email/verify')
        ->assertSee('Resend verification email')
        ->assertDontSee('Security settings');
});
