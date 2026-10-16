<?php

use App\Models\User;
use Laravel\Fortify\Features;

beforeEach(function () {
    if (! Features::enabled(Features::emailVerification())) {
        $this->markTestSkipped('Fortify email verification is not enabled.');
    }
});

it('shows unverified notice on profile after changing email', function () {
    $user = User::factory()->create([
        'email' => 'verified-user@example.com',
    ]);

    $page = visit('/login');

    $page->fill('email', 'verified-user@example.com')
        ->fill('password', 'password')
        ->click('Log in')
        ->assertPathIs('/dashboard')
        ->navigate('/settings/profile')
        ->fill('email', 'changed-user@example.com')
        ->click('[data-test="update-profile-button"]')
        ->assertSee('Your email address is unverified.');
});

it('redirects to email verification when opening security with unverified email', function () {
    $user = User::factory()->create([
        'email' => 'verified-user@example.com',
    ]);

    $page = visit('/login');

    $page->fill('email', 'verified-user@example.com')
        ->fill('password', 'password')
        ->click('Log in')
        ->navigate('/settings/profile')
        ->fill('email', 'changed-user@example.com')
        ->click('[data-test="update-profile-button"]')
        ->navigate('/settings/security')
        ->assertPathIs('/email/verify')
        ->assertSee('Resend verification email');
});
