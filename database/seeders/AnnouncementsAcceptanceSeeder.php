<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AnnouncementsAcceptanceSeeder extends Seeder
{
    /**
     * Seed announcements and a verified user for acceptance testing.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'acceptance@example.com'],
            [
                'name' => 'Acceptance Tester',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        Announcement::query()->delete();

        foreach (range(1, 25) as $number) {
            Announcement::query()->create([
                'title' => "第{$number}件",
                'body' => "お知らせ本文 {$number}",
                'created_at' => now()->subMinutes(25 - $number),
                'updated_at' => now()->subMinutes(25 - $number),
            ]);
        }
    }
}
