<?php

use App\Models\User;

it('redirects to email verification after changing email and visiting security settings', function () {
    $user = User::factory()->create([
        'email' => 'verified-browser@example.com',
    ]);

    $page = visit('/login');

    $page->fill('email', $user->email)
        ->fill('password', 'password')
        ->click('Log in')
        ->navigate('/settings/profile')
        ->fill('email', 'changed-browser@example.com')
        ->click('Save')
        ->navigate('/settings/security')
        ->assertPathIs('/email/verify')
        ->assertSee('Please verify your email address');
});
