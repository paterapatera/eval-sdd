import { defineBaselineNfrs } from "./schema/mod.ts";

export default defineBaselineNfrs({
  "BNFR-001": {
    title: "テスト実行時の DB",
    category: "システム環境・エコロジー",
    metric: "PHPUnit の DB 接続",
    target: "pgsql（testing データベース）",
    condition: "php artisan test / CI の composer setup 後",
    verification: "phpunit.xml の DB_* 環境変数、.github/workflows/tests.yml",
  },
  "BNFR-002": {
    title: "CI による品質ゲート",
    category: "運用・保守性",
    metric: "main ブランチへの変更時の自動チェック",
    target: "composer ci:check が成功する",
    condition: "GitHub Actions（ubuntu-latest、PHP 8.5、Node 22）",
    verification: ".github/workflows/tests.yml",
  },
});
