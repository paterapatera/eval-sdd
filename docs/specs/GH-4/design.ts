import { defineDesign } from "../../sdd/schema/mod.ts";
import type requirements from "./requirements.ts";

export default defineDesign<typeof requirements>()({
  overview:
    "お知らせを announcements テーブルと Eloquent モデルで永続化し、Artisan コマンドで登録、認証・メール確認済みミドルウェア配下の Inertia 画面で一覧（20件ページネーション）とダッシュボード（最新3件）を表示する。",
  asIs:
    "お知らせ用のテーブル・モデル・コマンドは無い。/dashboard は Route::inertia で静的ページのみ。サイドバーのメインナビは Dashboard のみ。",
  toBe:
    "announcements テーブルと Announcement モデル、announcement:create コマンド、AnnouncementController（一覧）、DashboardController（お知らせ props 付きダッシュボード）、announcements Inertia ページ、ダッシュボード・サイドバーの更新、Feature/Console テストを追加する。",
  components: {
    Announcement: {
      kind: "new",
      responsibility: "お知らせの永続化（title・body・created_at）と、新しい順のクエリの土台",
      files: [
        "app/Models/Announcement.php",
        "database/migrations/2026_10_11_105237_create_announcements_table.php",
        "database/factories/AnnouncementFactory.php",
      ],
    },
    CreateAnnouncementCommand: {
      kind: "new",
      responsibility: "announcement:create でタイトル・本文を検証し、Announcement を1件作成する",
      files: ["app/Console/Commands/CreateAnnouncementCommand.php"],
    },
    AnnouncementController: {
      kind: "new",
      responsibility: "GET /announcements でページネーション付き一覧を Inertia に渡す",
      files: ["app/Http/Controllers/AnnouncementController.php"],
    },
    DashboardController: {
      kind: "new",
      responsibility: "GET /dashboard で最新3件のお知らせタイトルを Inertia に渡す",
      files: ["app/Http/Controllers/DashboardController.php"],
    },
    AnnouncementsPage: {
      kind: "new",
      responsibility: "一覧の Head・パンくず、タイトル・本文全文・登録日、空状態、ページネーションリンクの表示",
      files: ["resources/js/pages/announcements.tsx"],
    },
    DashboardPage: {
      kind: "modified",
      responsibility: "Announcements セクションと最新3件（タイトル）・空状態の表示。既存のプレースホルダー領域はお知らせセクションに置き換える",
      files: ["resources/js/pages/dashboard.tsx"],
      asIs: "PlaceholderPattern のみで、サーバーからの props は無い",
    },
    AppSidebar: {
      kind: "modified",
      responsibility: "メインナビに「お知らせ」リンク（Wayfinder の announcements ルート）を追加",
      files: ["resources/js/components/app-sidebar.tsx"],
      asIs: "mainNavItems は Dashboard のみ",
    },
    AnnouncementListItem: {
      kind: "new",
      responsibility: "一覧1件分のタイトル・本文・日付のマークアップ（一覧とダッシュボードで共有）",
      files: ["resources/js/components/announcement-list-item.tsx"],
    },
  },
  dependencies: [
    { from: "CreateAnnouncementCommand", to: "Announcement", label: "レコード作成" },
    { from: "AnnouncementController", to: "Announcement", label: "一覧・ページネーション" },
    { from: "DashboardController", to: "Announcement", label: "最新3件の取得" },
    { from: "AnnouncementsPage", to: "AnnouncementListItem", label: "一覧行の表示" },
    { from: "DashboardPage", to: "AnnouncementListItem", label: "ダッシュボードではタイトルのみ利用（props で制御）" },
    { from: "AppSidebar", to: "AnnouncementsPage", label: "ナビゲーション先" },
  ],
  interfaces: {
    "CreateAnnouncementCommand::handle": {
      component: "CreateAnnouncementCommand",
      kind: "cli",
      change: "new",
      signature: "php artisan announcement:create {title} {body}",
      description: "title・body を検証し、成功時は Announcement を保存して exit 0、失敗時は stderr に日本語メッセージを出して exit 1",
    },
    "AnnouncementController::index": {
      component: "AnnouncementController",
      kind: "http",
      change: "new",
      signature: "public function index(Request $request): \\Inertia\\Response",
      description:
        "Announcement::query()->latest()->paginate(20) を Inertia ページ announcements に渡す。各件に title・body・publishedOn（created_at を app.timezone で Y-m-d）を含める",
    },
    "DashboardController::__invoke": {
      component: "DashboardController",
      kind: "http",
      change: "new",
      signature: "public function __invoke(Request $request): \\Inertia\\Response",
      description:
        "Announcement::query()->latest()->limit(3)->get(['title']) を recentAnnouncements として dashboard ページに渡す",
    },
    "GET /dashboard": {
      component: "DashboardController",
      kind: "http",
      change: "modified",
      signature: "Route::get('dashboard', DashboardController::class)->name('dashboard');",
      description: "認証・verified グループ内。Inertia ページ dashboard に recentAnnouncements を追加",
      compatibility:
        "URL と route 名 dashboard は維持。Route::inertia からコントローラに変わるが、利用者の URL は同じ。tests/Feature/DashboardTest.php の GET route('dashboard') はそのまま有効",
    },
    "GET /announcements": {
      component: "AnnouncementController",
      kind: "http",
      change: "new",
      signature: "Route::get('announcements', [AnnouncementController::class, 'index'])->name('announcements');",
      description: "middleware auth, verified。Inertia ページ announcements",
    },
  },
  dataModels: {
    announcements: {
      kind: "new",
      description: "運営お知らせ1件分",
      definition:
        "CREATE TABLE announcements (\n  id BIGSERIAL PRIMARY KEY,\n  title VARCHAR(100) NOT NULL,\n  body TEXT NOT NULL,\n  created_at TIMESTAMP NULL,\n  updated_at TIMESTAMP NULL\n);\nCREATE INDEX announcements_created_at_index ON announcements (created_at DESC);",
    },
  },
  errorHandling: [
    {
      case: "CLI: タイトルが空",
      handling: "CreateAnnouncementCommand で検証し、stderr に必須エラーを出力して FAILURE 終了",
      refs: ["AC-003"],
    },
    {
      case: "CLI: タイトルが101文字以上",
      handling: "CreateAnnouncementCommand で max:100 を検証し、stderr に100文字以内の旨を出力して FAILURE 終了",
      refs: ["AC-018"],
    },
    {
      case: "CLI: 本文が空",
      handling: "CreateAnnouncementCommand で検証し、stderr に必須エラーを出力して FAILURE 終了",
      refs: ["AC-019"],
    },
    {
      case: "CLI: 本文が2001文字以上",
      handling: "CreateAnnouncementCommand で max:2000 を検証し、stderr に2000文字以内の旨を出力して FAILURE 終了",
      refs: ["AC-020"],
    },
    {
      case: "Web: 未ログインで /announcements",
      handling: "routes/web.php の auth ミドルウェアで login へリダイレクト",
      refs: ["AC-006", "AC-013"],
    },
    {
      case: "Web: メール未確認で /announcements",
      handling: "verified ミドルウェアで /email/verify へリダイレクト（ダッシュボードと同様）",
      refs: ["AC-007"],
    },
    {
      case: "Web: 存在しないページ番号（例: ?page=99）",
      handling:
        "LengthAwarePaginator の既定挙動で HTTP 200・0件として扱い、Inertia で「お知らせはありません」を表示（件数0と同じ空状態コンポーネント）",
      refs: ["AC-017"],
    },
  ],
  impact: {
    create: [
      "app/Models/Announcement.php",
      "app/Console/Commands/CreateAnnouncementCommand.php",
      "app/Http/Controllers/AnnouncementController.php",
      "app/Http/Controllers/DashboardController.php",
      "database/migrations/2026_10_11_105237_create_announcements_table.php",
      "database/factories/AnnouncementFactory.php",
      "resources/js/pages/announcements.tsx",
      "resources/js/components/announcement-list-item.tsx",
      "tests/Feature/AnnouncementCreateCommandTest.php",
      "tests/Feature/AnnouncementIndexTest.php",
      "tests/Feature/DashboardAnnouncementsTest.php",
      "tests/Feature/Invariants/AuthenticationHomeTest.php",
      "tests/Browser/AnnouncementsTest.php",
      "database/seeders/AnnouncementsAcceptanceSeeder.php",
    ],
    modify: [
      "routes/web.php",
      "resources/js/pages/dashboard.tsx",
      "resources/js/components/app-sidebar.tsx",
    ],
  },
  decisions: [
    {
      title: "お知らせ機能の配置（AppShell）",
      decidedBy: "ai",
      context: "architecture.ts は app/ と Modules/ の二層。お知らせはアプリコアの利用者向け機能である。",
      decision: "Announcement モデル・コントローラ・コマンドは app/ 配下に置き、Modules は使わない",
      alternatives: [
        {
          option: "Modules/Announcements を新設",
          reason: "Demo 以外のモジュール先例が無く、Deptrac・vite 設定の追加が本 issue の範囲を超える",
        },
      ],
      adr: false,
    },
    {
      title: "ダッシュボードのデータ取得",
      decidedBy: "ai",
      context: "一覧とダッシュボードでサーバーから props が必要。現状 /dashboard は Route::inertia のみ。",
      decision: "DashboardController を追加し、route('dashboard') をコントローラに差し替える",
      alternatives: [
        {
          option: "HandleInertiaRequests::share で全ページにお知らせを載せる",
          reason: "未ログイン・welcome など不要な画面にも載る可能性があり、要件の範囲を超える",
        },
      ],
      adr: false,
    },
    {
      title: "一覧 UI の共有部品",
      decidedBy: "ai",
      context: "一覧とダッシュボードでお知らせ行のマークアップが重なる。フロントの重複検出ゲートの対象パスに含まれる。",
      decision: "announcement-list-item.tsx を共通化し、ダッシュボードではタイトルのみ表示モードにする",
      alternatives: [
        {
          option: "各ページに同じマークアップをコピー",
          reason: "マークアップの重複が品質ゲートで検出されるリスクが高い",
        },
      ],
      adr: false,
    },
  ],
  traceability: {
    "FR-001": ["CreateAnnouncementCommand", "Announcement"],
    "FR-002": ["AnnouncementController", "AnnouncementsPage", "AnnouncementListItem", "Announcement"],
    "FR-003": ["DashboardController", "DashboardPage", "AnnouncementListItem", "Announcement"],
    "FR-004": ["AppSidebar", "AnnouncementsPage"],
  },
  nfrStrategy: {},
  invariantStrategy: {
    "INV-001":
      "DashboardController は認証・verified グループ内の既存 dashboard ルートのみに載せ、ゲスト向けのリダイレクトロジックはミドルウェアに任せる。DashboardTest のゲストリダイレクト検証を維持する",
    "INV-002":
      "Fortify のログイン成功リダイレクトや AuthenticationTest は変更しない。DashboardController は /dashboard の表示のみ担当する",
    "INV-003": "config/fortify.php の home を変更しない",
  },
  conventionsCompliance: {
    "CONV-007":
      "Inertia ページ announcements.tsx を resources/js/pages/ に置き、AnnouncementController から Inertia::render('announcements', ...) で名前を一致させる。dashboard は既存の pages/dashboard.tsx を継続利用する",
    "CONV-008":
      "一覧・空状態・ページネーションは resources/js/components/ui/ の Button・Card 等と既存 app レイアウトを使い、新規 UI ライブラリは導入しない",
    "CONV-009": "announcement-list-item と各ページのクラス結合は cn() を使い、@theme トークンに沿った Tailwind ユーティリティのみ使う",
    "CONV-010":
      "サイドバーの href は wayfinder:generate 後の @/routes の announcements() を使う。ページネーションリンクは Inertia Link と paginator の URL を使う",
    "CONV-012":
      "Feature テストは RefreshDatabase と AnnouncementFactory でデータを用意する。CLI テストは Artisan::call と Announcement::query() で検証する",
  },
  checklist: {
    conventions: {
      result: "considered",
      note:
        "ProfileController・DashboardTest・app-sidebar の既存パターンに合わせた。新規依存ライブラリは無し（decisions）",
    },
    security: {
      result: "considered",
      note:
        "一覧・ダッシュボードは auth+verified グループ（errorHandling）。CLI はサーバー側のみ。お知らせに個人情報フィールドは無し",
    },
    dataIntegrity: {
      result: "considered",
      note: "1件の create は単一 INSERT。同時実行は独立した行挿入のみで整合性要件は無い",
    },
    performance: {
      result: "considered",
      note: "一覧は paginate(20) と created_at インデックス。ダッシュボードは limit(3) の単一クエリ",
    },
    observability: {
      result: "considered",
      note: "CLI 失敗は stderr。Web は通常の Laravel ログに任せ、本 issue では追加ログは設けない",
    },
    testability: {
      result: "considered",
      note: "Factory と RefreshDatabase。日付表示は created_at を固定して Feature テストで検証可能",
    },
    rollback: {
      result: "considered",
      note: "マイグレーション down で announcements テーブル削除。ルートを Route::inertia に戻せばダッシュボードを元に戻せる",
    },
    sharedFiles: {
      result: "considered",
      note: "routes/web.php の変更は dashboard 差し替えと announcements 追加のみ。他 issue との conflicts は現時点で重なり無し",
    },
  },
  risks: [
    "ダッシュボードのプレースホルダー UI をお知らせセクションに置き換えるため、見た目は大きく変わる（要件どおりの追加だが、スクリーンショットテストがある場合は更新が必要）",
    "登録日の YYYY-MM-DD は app.timezone に依存する。テストでは config または Carbon::setTestNow で固定する",
  ],
});
