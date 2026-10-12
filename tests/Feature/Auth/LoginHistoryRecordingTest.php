<?php

namespace Tests\Feature\Auth;

use App\Models\LoginHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
use Tests\TestCase;

class LoginHistoryRecordingTest extends TestCase
{
    use RefreshDatabase;

    public function test_successful_login_creates_login_history_with_ip(): void
    {
        $user = User::factory()->create();

        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();

        $history = LoginHistory::query()->where('user_id', $user->id)->sole();

        $this->assertSame('127.0.0.1', $history->ip_address);
    }

    public function test_two_factor_challenge_does_not_create_login_history_until_completed(): void
    {
        $this->skipUnlessFortifyHas(Features::twoFactorAuthentication());

        Features::twoFactorAuthentication([
            'confirm' => true,
            'confirmPassword' => true,
        ]);

        $user = User::factory()->withTwoFactor()->create();

        $this->post(route('login'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
        $this->assertDatabaseCount('login_histories', 0);

        $this->post(route('two-factor.login.store'), [
            'recovery_code' => 'recovery-code-1',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseCount('login_histories', 1);
    }

    public function test_failed_login_does_not_create_login_history(): void
    {
        $user = User::factory()->create();

        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
        $this->assertDatabaseCount('login_histories', 0);
    }

    public function test_first_login_after_feature_creates_single_history_record(): void
    {
        $user = User::factory()->create();

        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertDatabaseCount('login_histories', 1);
    }

    public function test_successful_login_redirects_to_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('dashboard', absolute: false));
    }
}
