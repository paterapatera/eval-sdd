<?php

namespace Database\Seeders;

use App\Models\LoginHistory;
use App\Models\User;
use Illuminate\Database\Seeder;

class LoginHistoryAcceptanceSeeder extends Seeder
{
    public const ACCEPTANCE_EMAIL = 'acceptance-login-history@example.com';

    public const ACCEPTANCE_PASSWORD = 'acceptance-login-history';

    public function run(): void
    {
        $raw = getenv('LOGIN_HISTORY_ACCEPTANCE_COUNT');
        $count = $raw === false || $raw === '' ? 0 : (int) $raw;

        if (! in_array($count, [0, 2, 11], true)) {
            $this->command->error('Set LOGIN_HISTORY_ACCEPTANCE_COUNT to 0, 2, or 11');

            return;
        }

        $user = User::query()->updateOrCreate(
            ['email' => self::ACCEPTANCE_EMAIL],
            [
                'name' => 'Acceptance Login History',
                'password' => self::ACCEPTANCE_PASSWORD,
                'email_verified_at' => now(),
            ],
        );

        LoginHistory::query()->where('user_id', $user->id)->delete();

        if ($count === 0) {
            $this->command->info('Login history cleared for acceptance user.');

            return;
        }

        for ($index = 0; $index < $count; $index++) {
            LoginHistory::factory()->for($user)->create([
                'logged_at' => now()->subMinutes($count - $index),
                'ip_address' => '198.51.100.'.($index + 1),
            ]);
        }

        $this->command->info("Created {$count} login history records for acceptance user.");
    }
}
