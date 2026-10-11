<?php

namespace Tests\Feature;

use App\Models\Announcement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class AnnouncementCreateCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_creates_announcement(): void
    {
        $exitCode = Artisan::call('announcement:create', [
            'title' => 'メンテナンス予定',
            'body' => '10月12日 2:00–4:00 に停止します',
        ]);

        $this->assertSame(0, $exitCode);
        $this->assertSame(1, Announcement::query()->count());
        $this->assertSame('メンテナンス予定', Announcement::query()->first()?->title);
    }

    public function test_command_accepts_max_length_title_and_body(): void
    {
        $title = str_repeat('あ', 100);
        $body = str_repeat('い', 2000);

        $exitCode = Artisan::call('announcement:create', [
            'title' => $title,
            'body' => $body,
        ]);

        $this->assertSame(0, $exitCode);
        $this->assertSame(1, Announcement::query()->count());
    }

    public function test_command_fails_when_title_is_empty(): void
    {
        $exitCode = Artisan::call('announcement:create', [
            'title' => '',
            'body' => '本文',
        ]);

        $this->assertSame(1, $exitCode);
        $this->assertStringContainsString('タイトルは必須', Artisan::output());
        $this->assertSame(0, Announcement::query()->count());
    }

    public function test_command_fails_when_title_exceeds_max_length(): void
    {
        $exitCode = Artisan::call('announcement:create', [
            'title' => str_repeat('あ', 101),
            'body' => 'お知らせ本文',
        ]);

        $this->assertSame(1, $exitCode);
        $this->assertStringContainsString('タイトルは100文字以内', Artisan::output());
    }

    public function test_command_fails_when_body_is_empty(): void
    {
        $exitCode = Artisan::call('announcement:create', [
            'title' => 'お知らせ',
            'body' => '',
        ]);

        $this->assertSame(1, $exitCode);
        $this->assertStringContainsString('本文は必須', Artisan::output());
    }

    public function test_command_fails_when_body_exceeds_max_length(): void
    {
        $exitCode = Artisan::call('announcement:create', [
            'title' => 'お知らせ',
            'body' => str_repeat('い', 2001),
        ]);

        $this->assertSame(1, $exitCode);
        $this->assertStringContainsString('本文は2000文字以内', Artisan::output());
    }
}
