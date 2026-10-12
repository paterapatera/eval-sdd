<?php

namespace Tests\Feature\Settings;

use App\Models\LoginHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LoginHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_history_page_shows_user_entries_in_descending_order(): void
    {
        $user = User::factory()->create();

        $older = LoginHistory::factory()->for($user)->create([
            'logged_at' => now()->subDay(),
            'ip_address' => '203.0.113.1',
        ]);

        $newer = LoginHistory::factory()->for($user)->create([
            'logged_at' => now(),
            'ip_address' => '203.0.113.2',
        ]);

        $this->actingAs($user)
            ->get(route('login-history.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/login-history')
                ->has('entries', 2)
                ->where('entries.0.ipAddress', $newer->ip_address)
                ->where('entries.1.ipAddress', $older->ip_address)
                ->where('entries.0.loggedAt', $newer->logged_at->timezone('Asia/Tokyo')->format('Y-m-d H:i'))
            );
    }

    public function test_login_history_page_shows_only_ten_most_recent_entries(): void
    {
        $user = User::factory()->create();

        LoginHistory::factory()
            ->count(11)
            ->for($user)
            ->sequence(fn ($sequence) => [
                'logged_at' => now()->subMinutes(11 - $sequence->index),
                'ip_address' => '10.0.0.'.($sequence->index + 1),
            ])
            ->create();

        $this->actingAs($user)
            ->get(route('login-history.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('entries', 10)
                ->where('entries.0.ipAddress', '10.0.0.11')
                ->where('entries.9.ipAddress', '10.0.0.2')
            );
    }

    public function test_guest_is_redirected_from_login_history(): void
    {
        $this->get(route('login-history.edit'))
            ->assertRedirect(route('login'));
    }

    public function test_guest_is_redirected_from_profile(): void
    {
        $this->get(route('profile.edit'))
            ->assertRedirect(route('login'));
    }

    public function test_unverified_user_can_view_login_history(): void
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)
            ->get(route('login-history.edit'))
            ->assertOk();
    }

    public function test_user_cannot_see_other_users_login_history(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        LoginHistory::factory()->for($userB)->create([
            'ip_address' => '198.51.100.99',
        ]);

        $this->actingAs($userA)
            ->get(route('login-history.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('entries', 0)
                ->where('isEmpty', true)
            );
    }

    public function test_profile_page_is_still_accessible(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('profile.edit'))
            ->assertOk();
    }
}
