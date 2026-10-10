import { defineAdr } from "../schema/mod.ts";

export default defineAdr({
  id: "ADR-0002",
  title: "Inertia v3 + React と shadcn 風 UI（Tailwind v4）",
  status: "accepted",
  date: "2026-10-10",
  context:
    "Laravel React Starter Kit ベースで、サーバー駆動ルーティングと React UI、認証付きの管理画面・設定画面を提供する。",
  decision:
    "Inertia.js（Laravel + React）、ページは resources/js/pages/、UI は Radix ベースの components/ui、スタイルは Tailwind CSS v4 と app.css のデザイントークン、ルート参照は Wayfinder を採用する。",
  consequences:
    "画面追加は Inertia ページと既存レイアウト・UI 部品の再利用が前提。Wayfinder 生成物はビルドで更新される。",
  alternatives: [
    {
      option: "Livewire / Blade 中心",
      reason: "既存コードベースが Inertia + React のため不採用。",
    },
    {
      option: "MUI などパッケージのみの UI ライブラリ",
      reason: "リポジトリ取り込み型の shadcn 風構成が既に使われているため不採用。",
    },
  ],
});
