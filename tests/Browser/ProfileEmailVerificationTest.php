<?php

use App\Models\User;

it('redirects to email verification after changing email and opening security settings', function () {
    $user = User::factory()->create([
        'email' => 'verified-user@example.com',
    ]);

    $page = visit('/login');

    $page->fill('email', $user->email)
        ->fill('password', 'password')
        ->click('Log in')
        ->assertPathIs('/dashboard');

    $page = visit('/settings/profile');

    $page->fill('email', 'changed-user@example.com')
        ->click('Save')
        ->assertPathIs('/settings/profile');

    $page = visit('/settings/security');

    $page->assertPathIs('/email/verify')
        ->assertSee('Resend verification email')
        ->assertDontSee('Update password');
});
