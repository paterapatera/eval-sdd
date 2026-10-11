<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardAnnouncementsTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_shows_three_most_recent_announcement_titles(): void
    {
        $user = User::factory()->create();

        foreach (range(1, 6) as $number) {
            Announcement::factory()->create([
                'title' => "第{$number}件",
                'created_at' => now()->subMinutes(6 - $number),
            ]);
        }

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->has('recentAnnouncements', 3)
                ->where('recentAnnouncements.0.title', '第6件')
                ->where('recentAnnouncements.1.title', '第5件')
                ->where('recentAnnouncements.2.title', '第4件'),
            );
    }

    public function test_dashboard_shows_empty_message_when_no_announcements(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('emptyMessage', 'お知らせはありません')
                ->has('recentAnnouncements', 0),
            );
    }
}
