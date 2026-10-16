<?php

use App\Models\User;

it('shows unverified notice after email change and redirects security settings to verification', function () {
    $user = User::factory()->create([
        'email' => 'before@example.com',
    ]);

    $page = visit('/login')
        ->fill('#email', $user->email)
        ->fill('#password', 'password')
        ->click('Log in')
        ->assertPathIs('/dashboard')
        ->navigate('/settings/profile')
        ->fill('#email', 'after@example.com')
        ->click('[data-test="update-profile-button"]')
        ->assertSee('Your email address is unverified.')
        ->navigate('/settings/security')
        ->assertPathIs('/email/verify');
});
