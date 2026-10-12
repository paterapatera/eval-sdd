import { defineTasks } from "../../sdd/schema/mod.ts";
import type design from "./design.ts";
import type requirements from "./requirements.ts";

export default defineTasks<typeof requirements, typeof design>()({
  tasks: {
    "T-001": {
      title: "login_histories のマイグレーションとモデルを追加する",
      kind: "impl",
      description:
        "database/migrations/*_create_login_histories_table.php（design の定義）、app/Models/LoginHistory.php、database/factories/LoginHistoryFactory.php を作成。" +
        "app/Models/User.php に loginHistories() HasMany を追加。logged_at・ip_address を fillable/casts で扱う。",
      refs: ["FR-001", "LoginHistory", "User"],
      status: "done",
    },
    "T-002": {
      title: "Login イベントでログイン記録するリスナーを登録する",
      kind: "impl",
      description:
        "app/Listeners/RecordUserLogin.php で Login イベント時に user_id・logged_at（now UTC）・request()->ip() を LoginHistory::create。" +
        "app/Providers/AppServiceProvider.php の bootApplication で Event::listen(Login::class, RecordUserLogin::class) を登録。",
      refs: ["FR-001", "RecordUserLogin", "AppServiceProvider"],
      status: "done",
    },
    "T-003": {
      title: "ログイン記録の Feature テストを追加する",
      kind: "test",
      description:
        "tests/Feature/Auth/LoginHistoryRecordingTest.php を追加。" +
        "正しいパスワードログインで login_histories が1件増え IP が保存される（AC-001）。" +
        "二要素チャレンジ前は0件・コード成功後1件（AC-002, AC-010）。" +
        "誤パスワードでは増えない（AC-003）。" +
        "リリース後初回ログインのみ1件で過去分は無い（AC-011）。" +
        "既存と同様ログイン成功後に intended 画面へ遷移する（INV-001）。",
      refs: ["FR-001", "RecordUserLogin", "LoginHistory"],
      verifies: ["AC-001", "AC-002", "AC-003", "AC-010", "AC-011", "INV-001"],
      status: "done",
    },
    "T-004": {
      title: "ログイン履歴画面のルートとコントローラを追加する",
      kind: "impl",
      description:
        "app/Http/Controllers/Settings/LoginHistoryController.php の edit で auth ユーザーの loginHistories を logged_at 降順 limit 10。" +
        "logged_at を Asia/Tokyo で Y-m-d H:i 文字列にし、Inertia::render('settings/login-history', { entries, isEmpty })。" +
        "routes/settings.php の auth グループに GET settings/login-history・name login-history.edit を追加。",
      refs: ["FR-002", "LoginHistoryController", "SettingsRoutes"],
      status: "done",
    },
    "T-005": {
      title: "ログイン履歴画面の Feature テストを追加する",
      kind: "test",
      description:
        "tests/Feature/Settings/LoginHistoryTest.php を追加。" +
        "actingAs で Inertia props の entries 件数・順序・日時文字列・IP（AC-004）。" +
        "11件保存時に props が10件かつ最新10件（AC-012）。" +
        "未ログインは login へリダイレクト（AC-006）。" +
        "profile 未ログインも login へ（AC-009）。" +
        "メール未確認ユーザーで 200（AC-014）。" +
        "他ユーザーの記録が混ざらない（INV-003）。" +
        "profile.edit が引き続き 200（INV-002）。",
      refs: ["FR-002", "LoginHistoryController"],
      verifies: [
        "AC-004",
        "AC-006",
        "AC-009",
        "AC-012",
        "AC-014",
        "INV-002",
        "INV-003",
      ],
      status: "todo",
    },
    "T-006": {
      title: "ログイン履歴の Inertia ページと設定ナビを追加する",
      kind: "impl",
      description:
        "resources/js/pages/settings/login-history.tsx（Heading、entries リスト、isEmpty 時「ログイン履歴はありません」、breadcrumbs）。" +
        "resources/js/layouts/settings/layout.tsx に「ログイン履歴」ナビ（Wayfinder の login-history.edit）。" +
        "npm run build または sail npm run build で Wayfinder 生成を反映。",
      refs: ["FR-002", "FR-003", "LoginHistoryPage", "SettingsLayout"],
      status: "todo",
    },
    "T-007": {
      title: "ログイン履歴の Browser（E2E）テストを追加する",
      kind: "e2e",
      description:
        "tests/Browser/LoginHistoryTest.php（Pest Browser）。" +
        "ログイン後 settings/profile でナビに「ログイン履歴」が見える（AC-007）。" +
        "ナビクリックで /settings/login-history（AC-008）。" +
        "Factory で2件用意し画面上に日時・IP が新しい順（AC-004）。" +
        "0件で「ログイン履歴はありません」（AC-005）。" +
        "11件で10行だけ表示（AC-012）。",
      refs: ["FR-003", "LoginHistoryPage", "SettingsLayout"],
      verifies: ["AC-004", "AC-005", "AC-007", "AC-008", "AC-012"],
      status: "todo",
    },
    "T-008": {
      title: "受け入れテスト用のログイン履歴シーダーを追加する",
      kind: "chore",
      description:
        "database/seeders/LoginHistoryAcceptanceSeeder.php を追加（本番 DatabaseSeeder からは呼ばない）。" +
        "固定の acceptance 用ユーザーに対し、0件・2件・11件の状態を Artisan オプションまたは複数メソッドで用意できるようにする。" +
        "sdd-impl 完了時の acceptanceGuide.data で参照する。",
      refs: ["FR-002"],
      status: "todo",
    },
  },
});
