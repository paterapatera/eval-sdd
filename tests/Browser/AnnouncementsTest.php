<?php

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAsVerifiedBrowserUser(): User
{
    $user = User::factory()->create();

    test()->actingAs($user);

    return $user;
}

it('shows announcements list with pagination', function () {
    actingAsVerifiedBrowserUser();

    Announcement::factory()->create([
        'title' => '最新',
        'body' => '最新の本文',
        'created_at' => now(),
    ]);

    foreach (range(2, 25) as $number) {
        Announcement::factory()->create([
            'title' => "第{$number}件",
            'body' => "本文{$number}",
            'created_at' => now()->subMinutes($number),
        ]);
    }

    visit('/announcements')
        ->assertSee('Announcements')
        ->assertSee('最新')
        ->assertSee('2');

    visit('/announcements?page=2')
        ->assertSee('第21件');
});

it('shows empty state on announcements index', function () {
    actingAsVerifiedBrowserUser();

    visit('/announcements')
        ->assertSee('お知らせはありません');
});

it('shows twenty announcements on one page without second page link', function () {
    actingAsVerifiedBrowserUser();

    Announcement::factory()->count(20)->create();

    visit('/announcements')
        ->assertSee('Announcements')
        ->assertDontSee('Next');
});

it('shows three recent announcements on dashboard', function () {
    actingAsVerifiedBrowserUser();

    foreach (range(1, 6) as $number) {
        Announcement::factory()->create([
            'title' => "第{$number}件",
            'created_at' => now()->subMinutes(6 - $number),
        ]);
    }

    visit('/dashboard')
        ->assertSee('Announcements')
        ->assertSee('第6件')
        ->assertSee('第5件')
        ->assertSee('第4件')
        ->assertDontSee('第3件');
});

it('shows two announcements on dashboard when only two exist', function () {
    actingAsVerifiedBrowserUser();

    Announcement::factory()->create([
        'title' => '新しい',
        'created_at' => now(),
    ]);
    Announcement::factory()->create([
        'title' => '古い',
        'created_at' => now()->subDay(),
    ]);

    visit('/dashboard')
        ->assertSee('新しい')
        ->assertSee('古い');
});

it('shows empty message on dashboard when no announcements', function () {
    actingAsVerifiedBrowserUser();

    visit('/dashboard')->assertSee('お知らせはありません');
});

it('links to announcements from sidebar', function () {
    actingAsVerifiedBrowserUser();

    visit('/dashboard')
        ->click('お知らせ')
        ->assertPathIs('/announcements');
});

it('shows empty announcements when opened from sidebar with no data', function () {
    actingAsVerifiedBrowserUser();

    visit('/dashboard')
        ->click('お知らせ')
        ->assertSee('お知らせはありません');
});
