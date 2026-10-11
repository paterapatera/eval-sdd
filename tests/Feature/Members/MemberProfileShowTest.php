<?php

namespace Tests\Feature\Members;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MemberProfileShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_user_can_view_member_profile(): void
    {
        $viewer = User::factory()->create();
        $member = User::factory()->create([
            'name' => '山田太郎',
            'bio' => 'よろしくお願いします',
            'created_at' => '2026-10-05 12:00:00',
        ]);

        $response = $this
            ->actingAs($viewer)
            ->get(route('members.show', $member));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('members/show')
                ->has('member', fn (Assert $props) => $props
                    ->where('id', $member->id)
                    ->where('name', '山田太郎')
                    ->where('bioDisplay', 'よろしくお願いします')
                    ->where('memberSinceLabel', '2026年10月から利用')
                    ->missing('email')
                ));
    }

    public function test_member_profile_returns_not_found_for_missing_user(): void
    {
        $viewer = User::factory()->create();

        $response = $this
            ->actingAs($viewer)
            ->get('/members/999999999');

        $response->assertNotFound();
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $member = User::factory()->create();

        $response = $this->get(route('members.show', $member));

        $response->assertRedirect(route('login'));
    }

    public function test_unverified_user_is_redirected_to_verification_notice(): void
    {
        $viewer = User::factory()->unverified()->create();
        $member = User::factory()->create();

        $response = $this
            ->actingAs($viewer)
            ->get(route('members.show', $member));

        $response->assertRedirect(route('verification.notice'));
    }
}
