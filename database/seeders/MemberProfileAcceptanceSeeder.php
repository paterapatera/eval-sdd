<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MemberProfileAcceptanceSeeder extends Seeder
{
    /**
     * Seed users for manual acceptance testing of GH-6 (not registered in DatabaseSeeder).
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'acceptance-viewer@example.com'],
            [
                'name' => 'Acceptance Viewer',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'bio' => '閲覧者の自己紹介です',
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'yamada@example.com'],
            [
                'name' => '山田太郎',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'bio' => 'よろしくお願いします',
                'created_at' => '2026-10-05 12:00:00',
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'empty-bio@example.com'],
            [
                'name' => '空のユーザー',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'bio' => null,
            ],
        );
    }
}
