<?php

use App\Models\User;

use function Pest\Laravel\actingAs;

it('shows an unverified notice after changing email and redirects security settings to verification', function () {
    $user = User::factory()->create([
        'email' => 'verified@example.com',
    ]);

    actingAs($user);

    $page = visit('/settings/profile');

    $page->fill('Email address', 'changed@example.com')
        ->click('Save')
        ->assertSee('Your email address is unverified.');

    visit('/settings/security')
        ->assertPathIs('/email/verify')
        ->assertSee('Resend verification email');
});
