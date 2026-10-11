<?php

namespace App\Console\Commands;

use App\Models\Announcement;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

#[Signature('announcement:create {title} {body}')]
#[Description('運営お知らせを1件登録する')]
class CreateAnnouncementCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $title = $this->argument('title');
        $body = $this->argument('body');

        $validator = Validator::make(
            [
                'title' => $title,
                'body' => $body,
            ],
            [
                'title' => ['required', 'string', 'max:100'],
                'body' => ['required', 'string', 'max:2000'],
            ],
            [
                'title.required' => 'タイトルは必須です。',
                'title.max' => 'タイトルは100文字以内で入力してください。',
                'body.required' => '本文は必須です。',
                'body.max' => '本文は2000文字以内で入力してください。',
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        Announcement::query()->create([
            'title' => $title,
            'body' => $body,
        ]);

        return self::SUCCESS;
    }
}
