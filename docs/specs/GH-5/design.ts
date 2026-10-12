import { defineDesign } from "../../sdd/schema/mod.ts";
import type requirements from "./requirements.ts";

export default defineDesign<typeof requirements>()({
  overview:
    "ログイン成功時に `login_histories` へ1件保存し、設定の `LoginHistoryController` が認証済み利用者の最新10件を日本時間の文字列で Inertia に渡す。" +
    "記録は `Illuminate\\Auth\\Events\\Login` のリスナーで行い、二要素認証完了後のセッション開始時のみ発火する既存の Fortify フローに乗せる。",
  asIs:
    "ログイン履歴の永続化・画面・ルートは無い。設定は `routes/settings.php` で profile（auth）と security/appearance（auth+verified）に分かれ、`resources/js/layouts/settings/layout.tsx` のナビは Profile / Security / Appearance のみ。",
  toBe:
    "`login_histories` テーブルと `LoginHistory` モデル、`RecordUserLogin` リスナーで Login イベント時に user_id・logged_at（UTC保存）・ip_address を挿入。" +
    "`/settings/login-history` は profile と同じ auth グループに追加し、コントローラが最新10件を JST の `Y-m-d H:i` で整形して `settings/login-history` ページに表示。ナビに「ログイン履歴」を追加。",
  components: {
    LoginHistory: {
      kind: "new",
      responsibility: "ログイン記録の Eloquent モデルと users への関連",
      files: ["app/Models/LoginHistory.php"],
    },
    RecordUserLogin: {
      kind: "new",
      responsibility: "Login イベントで利用者・日時・IP を login_histories に1件作成",
      files: ["app/Listeners/RecordUserLogin.php"],
    },
    LoginHistoryController: {
      kind: "new",
      responsibility: "ログイン履歴画面の Inertia レスポンス（最新10件・JST 表示・0件メッセージ用フラグ）",
      files: ["app/Http/Controllers/Settings/LoginHistoryController.php"],
    },
    LoginHistoryPage: {
      kind: "new",
      responsibility: "ログイン履歴一覧と空状態の表示、設定レイアウトの breadcrumbs",
      files: ["resources/js/pages/settings/login-history.tsx"],
    },
    User: {
      kind: "modified",
      responsibility: "loginHistories 関連の追加",
      files: ["app/Models/User.php"],
      asIs: "User モデルにログイン履歴の関連は無い",
    },
    SettingsRoutes: {
      kind: "modified",
      responsibility: "GET /settings/login-history と login-history.edit ルート（auth ミドルウェア）",
      files: ["routes/settings.php"],
      asIs: "login-history ルートは無い",
    },
    SettingsLayout: {
      kind: "modified",
      responsibility: "設定ナビに「ログイン履歴」リンクを追加",
      files: ["resources/js/layouts/settings/layout.tsx"],
      asIs: "Profile / Security / Appearance の3項目のみ",
    },
  },
  dependencies: [
    { from: "RecordUserLogin", to: "LoginHistory", label: "記録の INSERT" },
    { from: "LoginHistoryController", to: "LoginHistory", label: "利用者の最新10件を取得" },
    { from: "LoginHistoryController", to: "User", label: "認証済み利用者のスコープ" },
    { from: "LoginHistoryPage", to: "SettingsLayout", label: "app.tsx の settings/* レイアウトスタック" },
    { from: "SettingsLayout", to: "LoginHistoryPage", label: "Wayfinder の login-history ルートへリンク" },
    { from: "SettingsRoutes", to: "LoginHistoryController", label: "ルート解決" },
    { from: "User", to: "LoginHistory", label: "hasMany" },
  ],
  interfaces: {
    "login_histories (table)": {
      component: "LoginHistory",
      kind: "other",
      change: "new",
      signature:
        "id (bigint PK), user_id (FK users, cascade delete), logged_at (timestamp), ip_address (string), created_at, updated_at",
      description: "利用者ごとのログイン成功記録。logged_at は DB 上 UTC、画面表示時に Asia/Tokyo で整形。",
    },
    "User::loginHistories()": {
      component: "User",
      kind: "function",
      change: "new",
      signature: "public function loginHistories(): HasMany",
      description: "当該利用者の LoginHistory を新しい順に取得するための関連",
    },
    "RecordUserLogin::handle(Login $event)": {
      component: "RecordUserLogin",
      kind: "event",
      change: "new",
      signature: "public function handle(Login $event): void",
      description:
        "Login イベントの利用者と request()->ip() で LoginHistory::create。認証失敗時はイベントが発火しない。",
    },
    "GET /settings/login-history (login-history.edit)": {
      component: "LoginHistoryController",
      kind: "http",
      change: "new",
      signature: "LoginHistoryController::edit(Request $request): Response",
      description:
        "auth ミドルウェア。Inertia props: entries[{ loggedAt: string, ipAddress: string }], isEmpty: bool。entries は最大10件・logged_at 降順。",
    },
  },
  dataModels: {
    login_histories: {
      kind: "new",
      description: "ログイン成功1回につき1行。削除・上限ポリシーは本 issue では実装しない（要件の outOfScope）。",
      definition: `Schema::create('login_histories', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->timestamp('logged_at');
    $table->string('ip_address', 45);
    $table->timestamps();
    $table->index(['user_id', 'logged_at']);
});`,
    },
  },
  errorHandling: [
    {
      case: "未ログインの利用者が /settings/login-history または /settings/profile にアクセスする",
      handling: "既存の auth ミドルウェアがログイン画面へリダイレクトする（login-history は profile と同じ auth グループ）",
      refs: ["AC-006", "AC-009"],
    },
    {
      case: "パスワード等の認証に失敗する",
      handling: "Login イベントは発火しないため RecordUserLogin は実行されず、login_histories に行は追加されない",
      refs: ["AC-003"],
    },
    {
      case: "login_histories への INSERT が失敗する（DB 障害など）",
      handling: "例外をそのまま伝播し、ログイン処理自体は失敗させる（ログイン成功と記録の整合を優先）",
    },
  ],
  impact: {
    create: [
      "database/migrations/2026_10_12_000000_create_login_histories_table.php",
      "app/Models/LoginHistory.php",
      "database/factories/LoginHistoryFactory.php",
      "app/Listeners/RecordUserLogin.php",
      "app/Http/Controllers/Settings/LoginHistoryController.php",
      "resources/js/pages/settings/login-history.tsx",
      "tests/Feature/Auth/LoginHistoryRecordingTest.php",
      "tests/Feature/Settings/LoginHistoryTest.php",
      "tests/Browser/LoginHistoryTest.php",
      "database/seeders/LoginHistoryAcceptanceSeeder.php",
    ],
    modify: [
      "app/Models/User.php",
      "routes/settings.php",
      "resources/js/layouts/settings/layout.tsx",
    ],
  },
  decisions: [
    {
      title: "ログイン記録のトリガー",
      decidedBy: "ai",
      context: "FR-001 はログインフロー完了時の記録を要求。二要素はチャレンジ前では記録しない（AC-002）。",
      decision:
        "app/Listeners/RecordUserLogin の handle(Login) を Laravel のイベント自動検出で購読する（AppServiceProvider への手動登録は二重登録になるため行わない）。Fortify はセッション確立時に Login を発火する。",
      alternatives: [
        {
          option: "AppServiceProvider で Event::listen",
          reason: "自動検出と併用すると Login が2回記録される",
        },
        {
          option: "Fortify::authenticateThrough にフックを挿入",
          reason: "Fortify 内部フローへの結合が強く、INV-001 のリスクが高い",
        },
      ],
      adr: false,
    },
    {
      title: "日時の保存と表示",
      decidedBy: "ai",
      context: "要件は日本時間の `YYYY-MM-DD HH:mm` 表示。app.timezone は UTC。",
      decision:
        "logged_at はサーバー既定（UTC）で保存し、LoginHistoryController で Asia/Tokyo に変換して `Y-m-d H:i` 文字列を Inertia に渡す。",
      alternatives: [
        {
          option: "フロントで Intl.DateTimeFormat",
          reason: "ブラウザタイムゾーンを避ける要件に反する可能性がある",
        },
      ],
      adr: false,
    },
    {
      title: "一覧 UI の構成",
      decidedBy: "ai",
      context: "受け入れ条件は日時・IP・順序・件数・空文言のみ。",
      decision:
        "settings/login-history.tsx で既存の Heading コンポーネントと Tailwind の縦リスト（日時行 + IP 行）を新しい順に並べる。0件時は「ログイン履歴はありません」の1文のみ。",
      alternatives: [
        {
          option: "shadcn Table を新規追加",
          reason: "要件に無い共通部品の追加となり、settings 既存ページのパターンから外れる",
        },
      ],
      adr: false,
    },
  ],
  traceability: {
    "FR-001": ["RecordUserLogin", "LoginHistory"],
    "FR-002": ["LoginHistoryController", "LoginHistoryPage", "LoginHistory", "User"],
    "FR-003": ["SettingsLayout", "SettingsRoutes", "LoginHistoryPage"],
  },
  nfrStrategy: {},
  invariantStrategy: {
    "INV-001":
      "FortifyConfiguration と Fortify ルートには手を入れない。記録は Login イベントの副作用のみとし、既存の AuthenticationTest のリダイレクト期待を変えない。",
    "INV-002":
      "security / appearance のミドルウェアグループと profile の auth グループの境界は維持。login-history は auth グループにのみ追加する。",
    "INV-003":
      "LoginHistoryController は $request->user() の loginHistories() だけを読む。テストで他利用者の行が混ざらないことを Feature で固定する。",
  },
  conventionsCompliance: {
    "CONV-007":
      "Inertia ページは resources/js/pages/settings/login-history.tsx。サーバーは LoginHistoryController::edit から Inertia::render('settings/login-history', ...) とする。",
    "CONV-008":
      "Heading・既存 settings ページと同じ余白（space-y-6）。@/components/ui と layouts は既存の settings 画面と同様に使う。",
    "CONV-009": "一覧は Tailwind ユーティリティと cn() のみ。app.css のトークンに沿う。",
    "CONV-010":
      "ナビリンクは wayfinder:generate 後の @/routes/login-history（ルート名 login-history.edit）を使う。",
    "CONV-012":
      "Feature テストは tests/Feature/Settings/LoginHistoryTest.php と tests/Feature/Auth/LoginHistoryRecordingTest.php で RefreshDatabase と Factory を使う。",
  },
  checklist: {
    conventions: {
      result: "considered",
      note:
        "Settings の ProfileController・SecurityController、settings/*.tsx、ProfileUpdateTest の構成に合わせた（コンポーネント・ルート・テスト配置）",
    },
    security: {
      result: "considered",
      note:
        "閲覧は auth のみ（AC-014）。コントローラは認証ユーザーの関連のみ。IP は記録・表示するがパスワード等の秘密は扱わない。",
    },
    dataIntegrity: {
      result: "considered",
      note: "1ログイン1 INSERT。user 削除は FK cascade。同時ログインは別行として許容。",
    },
    performance: {
      result: "considered",
      note: "user_id + logged_at の複合インデックス。一覧は limit(10) の1クエリ。",
    },
    observability: {
      result: "considered",
      note: "INSERT 失敗は例外で通常の Laravel ログに残る。追加のログ出力は要件に無いため行わない。",
    },
    testability: {
      result: "considered",
      note: "LoginHistoryFactory で画面・境界件数を用意。認証フローは既存 Fortify テストパターンに倣う。",
    },
    rollback: {
      result: "considered",
      note: "マイグレーション down で login_histories を削除。ルート・ナビ・リスナー登録を revert すれば機能無効化。",
    },
    sharedFiles: {
      result: "considered",
      note: "routes/settings.php と settings/layout.tsx の差分は最小（1ルート・1ナビ項目）。",
    },
  },
  risks: [
    "Login イベントが想定外のガードや再ログインでも発火する場合、記録が増える。要件の『ログインフロー完了』と整合するか Fortify の挙動を実装時に AuthenticationTest / LoginHistoryRecordingTest で確認する。",
    "architecture.ts は app.timezone を明示していないが、実 config は UTC。表示は JST 固定で要件を満たす。",
  ],
});
