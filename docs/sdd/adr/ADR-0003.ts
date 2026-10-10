import { defineAdr } from "../schema/mod.ts";

export default defineAdr({
  id: "ADR-0003",
  title: "E2E は Pest Browser（Playwright）",
  status: "accepted",
  date: "2026-10-10",
  context: "Web UI があり、受け入れ条件を人の目だけに頼らないため E2E が必要。",
  decision:
    "pestphp/pest-plugin-browser と tests/Browser/ を E2E として使い、SDD の commands.e2e に `php artisan test --testsuite=Browser` を登録する。単体・結合は Browser 以外の testsuite。",
  consequences:
    "E2E は DB・ブラウザ依存のため gate --full で実行し、開発環境では Sail 等の準備が必要になる場合がある。",
  alternatives: [
    {
      option: "Laravel Dusk",
      reason: "既に Pest Browser と Playwright が導入済みのため不採用。",
    },
    {
      option: "Playwright のみ（PHP テストフレームワーク外）",
      reason: "Feature テストと同じ Pest で Browser スイートを分けられるため不採用。",
    },
  ],
});
