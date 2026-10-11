<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AnnouncementIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_announcements(): void
    {
        $response = $this->get(route('announcements'));

        $response->assertRedirect(route('login'));
    }

    public function test_unverified_users_are_redirected_from_announcements(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->get(route('announcements'));

        $response->assertRedirect(route('verification.notice'));
    }

    public function test_out_of_range_page_returns_empty_state_message(): void
    {
        $user = User::factory()->create();
        Announcement::factory()->count(5)->create();

        $response = $this->actingAs($user)->get(route('announcements', ['page' => 99]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('emptyMessage', 'お知らせはありません')
            ->has('announcements.data', 0),
        );
    }

    public function test_index_returns_paginated_announcements_newest_first(): void
    {
        $user = User::factory()->create();

        Announcement::factory()->create([
            'title' => '古い',
            'created_at' => now()->subDay(),
        ]);
        Announcement::factory()->create([
            'title' => '最新',
            'created_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('announcements'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('announcements')
                ->has('announcements.data', 2)
                ->where('announcements.data.0.title', '最新')
                ->where('announcements.data.1.title', '古い'),
            );
    }

    public function test_twenty_announcements_fit_on_first_page_without_next_link_in_meta(): void
    {
        $user = User::factory()->create();
        Announcement::factory()->count(20)->create();

        $this->actingAs($user)
            ->get(route('announcements'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('announcements.data', 20)
                ->where('announcements.last_page', 1),
            );
    }
}
