<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AcceptanceGh1UserSeeder extends Seeder
{
    /**
     * 受け入れテスト（GH-1 AC-002）用の確認済み利用者を用意する。
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'gh1-acceptance@example.com'],
            [
                'name' => 'GH-1 Acceptance User',
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );
    }
}
