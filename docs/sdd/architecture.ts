import { defineArchitecture } from "./schema/mod.ts";

export default defineArchitecture({
  basedOn: "4b207b5c64c6bf0de323cd1f1221e285f38f4bc8",
  updatedAt: "2026-10-11",
  summary:
    "Laravel を API・認証・ルーティングの土台とし、Inertia.js で React 画面を配信する Web アプリ。" +
    "コアは app/ と routes/、機能拡張は nwidart/laravel-modules の Modules/ に置く。認証は Fortify、フロントのルート解決は Wayfinder。",
  stack: [
    { name: "PHP", version: "^8.5", purpose: "サーバーサイド言語" },
    { name: "Laravel", version: "^13.17", purpose: "Web フレームワーク" },
    { name: "Inertia Laravel", version: "^3.0", purpose: "SPA 風のサーバー駆動ルーティング" },
    { name: "Fortify", version: "^1.37", purpose: "認証（ログイン・登録・2FA・パスキーなど）" },
    { name: "nwidart/laravel-modules", version: "^13.0", purpose: "モジュール分割" },
    { name: "Laravel Wayfinder", version: "^0.1", purpose: "型付きルート・コントローラ参照の生成" },
    { name: "React", version: "^19.2", purpose: "UI" },
    { name: "TypeScript", version: "^5.7", purpose: "フロントエンドの型" },
    { name: "Tailwind CSS", version: "^4.0", purpose: "スタイル" },
    { name: "Vite", version: "^8.0", purpose: "フロントのビルド" },
    { name: "vite-plus", version: "0.3.0", purpose: "vp check / vp dev などの開発・品質コマンド" },
    { name: "Pest", version: "^4.7", purpose: "PHP テスト（Feature・Browser）" },
    { name: "Playwright", version: "^1.64", purpose: "Browser テスト（Pest Browser）" },
  ],
  modules: {
    app: {
      path: "app/",
      responsibility:
        "アプリケーションコア（HTTP コントローラ・ミドルウェア・モデル・Fortify Actions・プロバイダ・Console コマンド）。利用者向けお知らせは Announcement モデル、AnnouncementController / DashboardController、announcement:create で提供する",
      dependsOn: [],
    },
    routes: {
      path: "routes/",
      responsibility: "Web・設定・コンソールのルート定義",
      dependsOn: ["app"],
    },
    frontend: {
      path: "resources/js/",
      responsibility:
        "Inertia ページ・レイアウト・UI コンポーネント・フロント共通処理（お知らせ一覧 announcements、共有部品 announcement-list-item、ダッシュボードのお知らせセクション）",
      dependsOn: [],
    },
    modules_demo: {
      path: "Modules/Demo/",
      responsibility: "laravel-modules のサンプル／拡張用モジュール（現状 Demo）",
      dependsOn: ["app"],
    },
    database: {
      path: "database/",
      responsibility: "マイグレーション・ファクトリ・シーダー",
      dependsOn: ["app"],
    },
  },
  layers: [
    {
      name: "AppShell / ModuleDemo / Framework（Deptrac）",
      rule:
        "AppShell（App\\）は Framework のみに依存。ModuleDemo（Modules\\Demo\\）は AppShell と Framework に依存。Framework 層は他層に依存しない（deptrac.yaml）",
    },
  ],
  notes: [
    "DDD 風の domain/application ディレクトリ分割は採用していない。境界は Deptrac の AppShell と各 Module に寄せている。",
    "Wayfinder が生成する resources/js/routes・actions は手編集しない。",
    "PHP 8.5 と PostgreSQL は Laravel Sail（compose.yaml）上で動かす。ホストの PHP 版と一致しない場合は `./vendor/bin/sail` 経由で artisan / composer を実行する。",
    "お知らせは運用担当者が `php artisan announcement:create` で登録し、auth+verified 配下の GET /announcements とダッシュボードで閲覧する（画面からの CRUD は対象外）。",
  ],
});
