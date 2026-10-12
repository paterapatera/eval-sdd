<?php

use App\Models\LoginHistory;
use App\Models\User;

it('shows login history link in settings navigation', function () {
    $user = User::factory()->create();

    visit('/login')
        ->fill('email', $user->email)
        ->fill('password', 'password')
        ->click('Log in')
        ->assertPathIs('/dashboard');

    visit('/settings/profile')
        ->assertSee('ログイン履歴');
});

it('navigates to login history from settings', function () {
    $user = User::factory()->create();

    visit('/login')
        ->fill('email', $user->email)
        ->fill('password', 'password')
        ->click('Log in');

    visit('/settings/profile')
        ->click('ログイン履歴')
        ->assertPathIs('/settings/login-history');
});

it('displays login entries in descending order', function () {
    $user = User::factory()->create();

    LoginHistory::factory()->for($user)->create([
        'logged_at' => now()->subDay(),
        'ip_address' => '203.0.113.1',
    ]);

    LoginHistory::factory()->for($user)->create([
        'logged_at' => now(),
        'ip_address' => '203.0.113.2',
    ]);

    visit('/login')
        ->fill('email', $user->email)
        ->fill('password', 'password')
        ->click('Log in');

    visit('/settings/login-history')
        ->assertSee('203.0.113.2')
        ->assertSee('203.0.113.1');
});

it('shows empty state when there is no login history', function () {
    $user = User::factory()->create();

    visit('/login')
        ->fill('email', $user->email)
        ->fill('password', 'password')
        ->click('Log in');

    LoginHistory::query()->where('user_id', $user->id)->delete();

    visit('/settings/login-history')
        ->assertSee('ログイン履歴はありません');
});

it('shows only ten most recent login entries', function () {
    $user = User::factory()->create();

    visit('/login')
        ->fill('email', $user->email)
        ->fill('password', 'password')
        ->click('Log in');

    LoginHistory::query()->where('user_id', $user->id)->delete();

    LoginHistory::factory()
        ->count(11)
        ->for($user)
        ->sequence(fn ($sequence) => [
            'logged_at' => now()->subMinutes(11 - $sequence->index),
            'ip_address' => '198.51.100.'.($sequence->index + 1),
        ])
        ->create();

    $page = visit('/settings/login-history');

    $page->assertCount('[data-testid="login-history-entry"]', 10)
        ->assertSee('198.51.100.11')
        ->assertSee('198.51.100.2');
});
