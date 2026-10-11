import { defineTasks } from "../../sdd/schema/mod.ts";
import type design from "./design.ts";
import type requirements from "./requirements.ts";

export default defineTasks<typeof requirements, typeof design>()({
  tasks: {
    "T-001": {
      title: "変えてはいけない振る舞いの Feature テストを追加する",
      kind: "test",
      description:
        "tests/Feature/Invariants/AuthenticationHomeTest.php を新規作成し、未ログインの GET route('dashboard') が login へ 302 すること（INV-001）、ログイン成功後 dashboard へリダイレクトすること（INV-002）、config('fortify.home') が '/dashboard' であること（INV-003）を RefreshDatabase で検証する。",
      refs: ["INV-001", "INV-002", "INV-003"],
      verifies: ["INV-001", "INV-002", "INV-003"],
      status: "done",
    },
    "T-002": {
      title: "お知らせのマイグレーション・モデル・ファクトリを追加する",
      kind: "impl",
      description:
        "database/migrations/2026_10_11_000000_create_announcements_table.php（title string 100, body text, created_at index）、app/Models/Announcement.php（fillable title/body、$table 明示）、database/factories/AnnouncementFactory.php（title/body の既定値）を design の dataModels に合わせて作成する。",
      refs: ["Announcement", "FR-002", "FR-003"],
      status: "todo",
    },
    "T-003": {
      title: "announcement:create コマンドを実装する",
      kind: "impl",
      description:
        "app/Console/Commands/CreateAnnouncementCommand.php を追加する。signature announcement:create {title} {body}。Validator で title 1〜100・body 1〜2000 を検証し、失敗時は stderr に日本語メッセージを出して FAILURE、成功時は Announcement::create して SUCCESS。",
      refs: ["CreateAnnouncementCommand", "FR-001"],
      status: "todo",
    },
    "T-004": {
      title: "announcement:create の Feature テストを追加する",
      kind: "test",
      description:
        "tests/Feature/AnnouncementCreateCommandTest.php で Artisan::call を実行し、AC-001（正常登録と DB 1件）、AC-002（100/2000文字境界）、AC-003・AC-018〜020（空・超過で失敗と stderr）を検証する。RefreshDatabase を使い testing の pgsql 接続で動作することで BNFR-001 を満たす。",
      refs: ["CreateAnnouncementCommand", "FR-001"],
      verifies: ["AC-001", "AC-002", "AC-003", "AC-018", "AC-019", "AC-020", "BNFR-001"],
      status: "todo",
    },
    "T-005": {
      title: "お知らせ一覧の API・Inertia ページを実装する",
      kind: "impl",
      description:
        "AnnouncementController@index（latest()->paginate(20)、publishedOn を Y-m-d）、routes/web.php に auth+verified グループで GET announcements（name announcements）、resources/js/pages/announcements.tsx（Head/breadcrumbs「Announcements」、空状態「お知らせはありません」、Laravel ページネーション Link）、resources/js/components/announcement-list-item.tsx（title/body/date 表示）を実装。wayfinder 生成後は @/routes の announcements() を使う。",
      refs: ["AnnouncementController", "AnnouncementsPage", "AnnouncementListItem", "FR-002"],
      status: "todo",
    },
    "T-006": {
      title: "お知らせ一覧の HTTP Feature テストを追加する",
      kind: "test",
      description:
        "tests/Feature/AnnouncementIndexTest.php で、ゲスト・未確認ユーザーが /announcements で 302（AC-006、AC-007）、存在しない page で 200 と空文言（AC-017）、確認済みユーザーで Inertia props の件数・並び（AC-004/015/016 のサーバー側）を assertInertia で検証する。composer test が CI で走る前提の回帰として BNFR-002 を covers。",
      refs: ["AnnouncementController", "FR-002", "FR-004"],
      verifies: ["AC-006", "AC-007", "AC-013", "AC-017", "BNFR-002"],
      status: "todo",
    },
    "T-007": {
      title: "ダッシュボードにお知らせセクションを実装する",
      kind: "impl",
      description:
        "DashboardController（__invoke、recentAnnouncements に latest()->limit(3) の title）、routes/web.php の dashboard をコントローラに差し替え、resources/js/pages/dashboard.tsx に「Announcements」見出し・最新3件タイトル・「お知らせはありません」を表示（announcement-list-item のタイトルのみモード）。",
      refs: ["DashboardController", "DashboardPage", "AnnouncementListItem", "FR-003"],
      status: "todo",
    },
    "T-008": {
      title: "サイドバーにお知らせナビを追加する",
      kind: "impl",
      description:
        "resources/js/components/app-sidebar.tsx の mainNavItems に title「お知らせ」、href announcements()、適切な lucide アイコンを追加する。",
      refs: ["AppSidebar", "FR-004"],
      status: "todo",
    },
    "T-009": {
      title: "受け入れテスト用のお知らせデータシーダーを追加する",
      kind: "chore",
      description:
        "database/seeders/AnnouncementsAcceptanceSeeder.php と php artisan db:seed --class=AnnouncementsAcceptanceSeeder で、25件のお知らせ（タイトル「第N件」、created_at を順不同）と acceptance@example.com / password 確認済みユーザーを用意する。本番 Seeder には組み込まない。",
      refs: ["Announcement", "FR-002", "FR-003"],
      status: "todo",
    },
    "T-010": {
      title: "お知らせ画面の Browser（E2E）テストを追加する",
      kind: "e2e",
      description:
        "tests/Browser/AnnouncementsTest.php（Pest Browser）で acceptance ユーザーでログインし、AC-004・AC-015・AC-005・AC-016（一覧とページネーション）、AC-008・AC-014・AC-009（ダッシュボード）、AC-011・AC-012（サイドバーナビ）の then を assertSee / clickLink で検証する。Factory または Seeder でデータを用意し、gate の e2e スイートで実行される。",
      refs: ["AnnouncementsPage", "DashboardPage", "AppSidebar", "FR-002", "FR-003", "FR-004"],
      verifies: [
        "AC-004",
        "AC-005",
        "AC-008",
        "AC-009",
        "AC-011",
        "AC-012",
        "AC-014",
        "AC-015",
        "AC-016",
      ],
      status: "todo",
    },
  },
});
