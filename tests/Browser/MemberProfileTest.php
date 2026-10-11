<?php

use App\Models\User;

use function Pest\Laravel\actingAs;

it('allows updating bio on profile settings', function () {
    $user = User::factory()->create([
        'email' => 'profile-bio@example.com',
        'password' => bcrypt('password'),
    ]);

    actingAs($user);

    $page = visit('/settings/profile');

    $page->assertSee('Bio')
        ->fill('bio', 'テスト用の自己紹介です')
        ->click('Save')
        ->assertSee('Profile updated');

    visit('/settings/profile')->assertSee('テスト用の自己紹介です');
});

it('displays another members public profile', function () {
    $viewer = User::factory()->create();
    $member = User::factory()->create([
        'name' => '山田太郎',
        'bio' => 'よろしくお願いします',
        'created_at' => '2026-10-05 12:00:00',
    ]);

    actingAs($viewer);

    visit('/members/'.$member->id)
        ->assertSee('山田太郎')
        ->assertSee('よろしくお願いします')
        ->assertSee('2026年10月から利用')
        ->assertDontSee($member->email);
});

it('shows placeholder when bio is empty', function () {
    $viewer = User::factory()->create();
    $member = User::factory()->create([
        'name' => '空のユーザー',
        'bio' => null,
    ]);

    actingAs($viewer);

    visit('/members/'.$member->id)->assertSee('自己紹介はまだありません');
});

it('preserves line breaks in bio display', function () {
    $viewer = User::factory()->create();
    $member = User::factory()->create([
        'bio' => "1行目\n2行目",
    ]);

    actingAs($viewer);

    $page = visit('/members/'.$member->id);

    $page->assertSee('1行目')->assertSee('2行目');
});
