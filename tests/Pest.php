<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Browser');

/*
 * テストの実行を途中で打ち切っても（sail のクライアントだけが止まる）、コンテナの中の Pest は DB のトランザクションを開いたまま残る。
 * 次の実行は RefreshDatabase がそのロックを待って止まる。また Pest Browser は、終了後も Playwright のサーバーと Chromium を残す。
 * 開始時に、自分と親以外の Pest、Playwright、Chromium を止める（前の実行が残したものは、次の実行の開始時に片付く）。
 */
$stopTestProcesses = static function (string $pattern): void {
    if (PHP_OS_FAMILY === 'Windows') {
        return;
    }
    $own = [getmypid(), function_exists('posix_getppid') ? posix_getppid() : 0];
    exec('ps -eo pid=,args=', $lines);
    foreach ($lines as $line) {
        $parts = preg_split('/\s+/', trim($line), 2);
        if ($parts === false || count($parts) < 2 || in_array((int) $parts[0], $own, true)) {
            continue;
        }
        if (preg_match($pattern, $parts[1]) === 1) {
            exec('kill -9 '.(int) $parts[0].' 2>/dev/null');
        }
    }
    @unlink(__DIR__.'/../vendor/pestphp/pest-plugin-browser/.temp/playwright-server.json');
};
$stopTestProcesses('#artisan test|pest/bin/pest|playwright run-server|chrome-headless-shell#');
