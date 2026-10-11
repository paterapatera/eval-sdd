import { defineTasks } from "../../sdd/schema/mod.ts";
import type design from "./design.ts";
import type requirements from "./requirements.ts";

export default defineTasks<typeof requirements, typeof design>()({
  tasks: {
    "T-001": {
      title: "users.bio マイグレーションと User モデルを追加する",
      kind: "impl",
      description:
        "database/migrations/2026_10_11_000000_add_bio_to_users_table.php で bio nullable string(160) を追加。" +
        "app/Models/User.php の Fillable・@property に bio を追加。" +
        "database/factories/UserFactory.php に bio の optional 状態（省略時 null）を追加。",
      refs: ["FR-001", "AddBioToUsersTable", "User"],
      status: "done",
    },
    "T-002": {
      title: "プロフィール検証に bio ルールを追加する",
      kind: "impl",
      description:
        "app/Concerns/ProfileValidationRules.php の profileRules に bio => ['nullable','string','max:160'] を追加。" +
        "ProfileController は validated の fill のためコード変更は不要（bio が fillable に入れば保存される）。",
      refs: ["FR-001", "ProfileValidationRules", "ProfileController"],
      status: "done",
    },
    "T-003": {
      title: "プロフィール bio 更新の Feature テストを追加する",
      kind: "test",
      description:
        "tests/Feature/Settings/ProfileUpdateTest.php に、bio 保存・160文字成功・161文字422・空文字成功・name/email のみ PATCH（INV-001）を追加。" +
        "actingAs で PATCH route('profile.update') を叩き DB と session errors を検証。",
      refs: ["FR-001", "ProfileController"],
      verifies: ["AC-002", "AC-003", "AC-010", "INV-001"],
      status: "done",
    },
    "T-004": {
      title: "未ログイン時のプロフィール設定アクセスを検証するテストを追加する",
      kind: "test",
      description:
        "tests/Feature/Settings/ProfileUpdateTest.php または新規 ProfileSettingsAuthenticationTest で、" +
        "ゲストの GET profile.edit と PATCH profile.update が login へリダイレクトされることを検証（INV-002）。",
      refs: ["INV-002", "ProfileController"],
      verifies: ["INV-002"],
      status: "done",
    },
    "T-005": {
      title: "プロフィール設定画面に Bio 入力を追加する",
      kind: "impl",
      description:
        "resources/js/components/ui/textarea.tsx を Input と同系スタイルで新規作成。" +
        "resources/js/pages/settings/profile.tsx に Label「Bio」、textarea（name=bio、maxLength 160、defaultValue auth.user.bio）を追加。" +
        "resources/js/types/auth.ts の User に bio?: string | null を追加。npm run build または wayfinder でフォーム URL を維持。",
      refs: ["FR-001", "ProfileSettingsPage", "Textarea"],
      status: "done",
    },
    "T-006": {
      title: "メンバープロフィール API とルートを実装する",
      kind: "impl",
      description:
        "app/Http/Controllers/MemberProfileController.php を新規作成。show(User $user) で member 配列" +
        "（id, name, bioDisplay, memberSinceLabel）のみ Inertia::render('members/show')。" +
        "bioDisplay は空なら「自己紹介はまだありません」。memberSinceLabel は created_at を「Y年n月から利用」。" +
        "routes/web.php の auth+verified グループに Route::get('members/{user}', ...)->name('members.show') を追加。",
      refs: ["FR-002", "FR-003", "MemberProfileController", "User"],
      status: "done",
    },
    "T-007": {
      title: "メンバープロフィール画面を実装する",
      kind: "impl",
      description:
        "resources/js/pages/members/show.tsx を新規作成。props.member の name・memberSinceLabel・bioDisplay を表示。" +
        "自己紹介は whitespace-pre-wrap。メール欄は置かない。AppLayout 既定レイアウトを利用。",
      refs: ["FR-002", "MemberShowPage"],
      status: "done",
    },
    "T-008": {
      title: "メンバープロフィールの Feature テストを追加する",
      kind: "test",
      description:
        "tests/Feature/Members/MemberProfileShowTest.php を新規作成。" +
        "verified ユーザーで GET members.show が 200 と Inertia props（名前・bioDisplay・memberSinceLabel、email 無し）。" +
        "存在しない ID で 404。ゲストは login へ。unverified は verification.notice へ。",
      refs: ["FR-002", "FR-003", "MemberProfileController"],
      verifies: ["AC-006", "AC-007", "AC-008", "AC-009"],
      status: "done",
    },
    "T-009": {
      title: "プロフィールとメンバー表示の Browser テストを追加する",
      kind: "e2e",
      description:
        "tests/Browser/MemberProfileTest.php（Pest Browser）で人が確かめる受け入れ条件を検証。" +
        "AC-001: ログイン→settings/profile で Bio ラベル・入力・保存後の表示と成功フィードバック。" +
        "AC-004: 別ユーザーの members ページで名前・自己紹介・利用開始文言・メール非表示。" +
        "AC-005: bio 空ユーザーで「自己紹介はまだありません」。" +
        "AC-011: 改行入り bio が別行表示。UserFactory でデータ用意。",
      refs: ["FR-001", "FR-002", "ProfileSettingsPage", "MemberShowPage"],
      verifies: ["AC-001", "AC-004", "AC-005", "AC-011"],
      status: "done",
    },
    "T-010": {
      title: "受け入れテスト用の開発シーダーを追加する",
      kind: "chore",
      description:
        "database/seeders/MemberProfileAcceptanceSeeder.php を新規作成（本番 DatabaseSeeder には登録しない）。" +
        "メール確認済みの閲覧者・表示対象ユーザー（名前・bio・created_at 固定）を用意し、README または acceptanceGuide でクラス名を参照できるようにする。",
      refs: ["FR-002"],
      status: "done",
    },
  },
  acceptanceGuide: {
    setup: [
      { run: "./vendor/bin/sail up -d", note: "Sail が未起動の場合" },
      { run: "./vendor/bin/sail artisan migrate --force" },
      { run: "./vendor/bin/sail npm run build" },
    ],
    accounts: [
      {
        id: "acceptance-viewer@example.com",
        password: "password",
        role: "メール確認済み（閲覧者）",
      },
      {
        id: "yamada@example.com",
        password: "password",
        role: "メール確認済み（表示対象・山田太郎）",
      },
    ],
    data: [
      {
        acs: ["AC-001", "AC-004", "AC-005", "AC-011"],
        run: "./vendor/bin/sail artisan db:seed --class=MemberProfileAcceptanceSeeder",
        expect: "yamada@example.com（bio あり）、empty-bio@example.com（bio なし）が存在する",
      },
    ],
    check: [
      {
        url: "http://localhost:8000",
        contains: '"component":"welcome"',
        note: "Sail 起動後（APP_URL）に Inertia の welcome が返ること",
      },
    ],
    notes: [
      "acceptance-viewer@example.com / password でログイン後、/settings/profile で Bio（AC-001）、/members/<山田のID> で公開プロフィール（AC-004 など）を確認する。",
      "山田太郎のユーザー ID はシーダー後に ./vendor/bin/sail artisan tinker --execute 'echo App\\\\Models\\\\User::where(\"email\", \"yamada@example.com\")->value(\"id\");' で確認できる。",
    ],
  },
});
