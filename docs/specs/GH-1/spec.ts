import { defineQuickSpec } from "../../sdd/schema/mod.ts";

export default defineQuickSpec({
  issue: "GH-1",
  kind: "bugfix",
  summary:
    "プロフィールでメールアドレスを変更したときに確認済み状態がリセットされず、確認が必要な設定画面に入れてしまう不具合を直す。",
  cause: {
    reproduction: [
      "メールアドレスを確認済みのユーザーでログインする",
      "/settings/profile でメールアドレスを別のアドレスに変えて保存する",
      "/settings/security を開く",
    ],
    rootCause:
      "ProfileController::update で fill 後に save() してから wasChanged('email') で分岐しているが、save() 後は変更フラグがクリアされるため分岐に入らず、入っても email_verified_at を null にしたあと再 save していない（app/Http/Controllers/Settings/ProfileController.php 35–40 行付近）。",
  },
  expected: {
    "FR-001": {
      title: "メールアドレス変更時の確認状態",
      ears: {
        pattern: "event",
        trigger: "利用者がプロフィールでメールアドレスを変更して保存した",
        response: "新しいメールアドレスは未確認として扱わなければならない",
      },
      acceptance: [
        {
          id: "AC-001",
          kind: "normal",
          verifiedBy: "automated",
          given: ["メールアドレスが確認済みのユーザーがいる"],
          when: "プロフィールで別のメールアドレスに変えて保存する",
          then: ["ユーザーの email_verified_at が null になる"],
        },
        {
          id: "AC-002",
          kind: "boundary",
          verifiedBy: "automated",
          given: ["メールアドレスが確認済みのユーザーがいる"],
          when: "プロフィールでメールアドレスの大文字と小文字だけを変えて保存する",
          then: ["ユーザーの email_verified_at が null になる"],
        },
        {
          id: "AC-003",
          kind: "normal",
          verifiedBy: "automated",
          given: ["メールアドレスが確認済みのユーザーがいる"],
          when: "プロフィールで名前だけを変えて保存する（メールアドレスは同じ）",
          then: ["ユーザーの email_verified_at は null にならない"],
        },
      ],
      notApplicable: {
        error: "プロフィール更新のバリデーション失敗時の扱いは既存のままで、今回は変えない",
      },
    },
    "FR-002": {
      title: "未確認時の確認が必要な画面へのアクセス",
      ears: {
        pattern: "state",
        state: "利用者のメールアドレスが未確認である",
        response: "確認が必要な設定画面に入ろうとしたとき、メールアドレス確認の案内に回されなければならない",
      },
      acceptance: [
        {
          id: "AC-004",
          kind: "normal",
          verifiedBy: "automated",
          given: [
            "メールアドレスを確認済みだったユーザーが、プロフィールで別のアドレスに変えて保存した直後",
          ],
          when: "GET /settings/security（security.edit）する",
          then: ["verification.notice（/email/verify）へリダイレクトされる"],
        },
      ],
      notApplicable: {
        boundary: "確認が必要な画面は issue の例（/settings/security）と既存の verified ミドルウェアの範囲に限定し、個別の画面を列挙しない",
        error: "未確認ユーザーが確認案内以外の画面に入る既存の扱いは変えない",
      },
    },
  },
  invariants: {
    "INV-001": {
      title: "確認メールの自動送信",
      behavior: "メールアドレス変更時に確認メールを自動送信しない（プロフィール画面の再送で足りる）",
      verification: "ProfileController::update から VerificationNotification 等を新たに送らない",
      verifiedBy: "automated",
    },
    "INV-002": {
      title: "verified ミドルウェアのリダイレクト先",
      behavior: "未確認ユーザーが verified が付いたルートにアクセスしたとき、既存どおり verification.notice（/email/verify）へリダイレクトする",
      verification: "EmailVerificationTest の未確認ユーザー向けテストが通る",
      verifiedBy: "automated",
    },
  },
  issueCoverage: [
    {
      source: "メールアドレスを変えたら、新しいアドレスは未確認として扱う",
      coveredBy: ["FR-001", "AC-001", "AC-002"],
    },
    {
      source:
        "未確認の間は、確認が必要な画面に入ろうとすると、メールアドレスの確認の案内（`/email/verify`）に回される",
      coveredBy: ["FR-002", "AC-004"],
    },
  ],
  checklist: {
    actors: { result: "notApplicable", note: "認証済み利用者のみ" },
    dataStates: {
      result: "considered",
      note: "確認済み→メール変更（AC-001）、大文字小文字のみ変更（AC-002）、名前のみ変更（AC-003）",
    },
    inputValidation: { result: "notApplicable", note: "既存の ProfileUpdateRequest のまま" },
    errorFeedback: { result: "notApplicable", note: "バリデーションエラー時の表示は既存のまま" },
    existingData: {
      result: "considered",
      note: "既存ユーザーの email_verified_at を、メール未変更時は維持（AC-003）",
    },
    consistency: {
      result: "considered",
      note: "routes/settings.php の verified ミドルウェアと FR-002・INV-002 を整合",
    },
    outOfScope: {
      result: "considered",
      note: "確認メールの自動送信、architecture.ts 未反映の構成変更、DB スキーマ変更は対象外",
    },
  },
  conventionsCompliance: {
    "CONV-007": "該当しない: 画面の追加・移動は行わない",
    "CONV-008": "該当しない: UI コンポーネントの変更は行わない",
    "CONV-009": "該当しない: スタイルやデザイントークンの変更は行わない",
    "CONV-010": "該当しない: フロントのルート URL の変更は行わない",
    "CONV-012": "Feature テストは RefreshDatabase と User ファクトリで追加する",
  },
  approach:
    "save 前にメールアドレスが変わったかを判定し、変わった場合は email_verified_at を null にしてから1回の save で永続化する。Feature テストで AC-001〜003 と、変更後の security ルートのリダイレクトを追加する。",
  impact: {
    create: [],
    modify: [
      "app/Http/Controllers/Settings/ProfileController.php",
      "tests/Feature/Settings/ProfileUpdateTest.php",
    ],
  },
  acceptanceGuide: {
    setup: [
      {
        run: "./vendor/bin/sail artisan migrate --force",
        note: "Sail 起動中を前提に、DB を最新にする",
      },
      { run: "./vendor/bin/sail npm run build", note: "フロント資産をビルドする" },
    ],
    accounts: [
      {
        id: "acceptance@example.com",
        password: "password",
        role: "メール確認済み（data のコマンドで作成）",
      },
    ],
    data: [
      {
        acs: ["AC-001", "AC-004"],
        run: './vendor/bin/sail artisan tinker --execute="App\\Models\\User::query()->where(\'email\', \'acceptance@example.com\')->delete(); App\\Models\\User::factory()->create([\'email\' => \'acceptance@example.com\', \'password\' => \'password\']);"',
        expect: "acceptance@example.com の確認済みユーザーが1件いる",
      },
    ],
    check: [
      {
        url: "http://localhost:8000/login",
        contains: "auth\\/login",
        note: "Sail の APP_URL（http://localhost:8000）でアプリが応答すること",
      },
    ],
    notes: [
      "受け入れ手順（人）: acceptance@example.com / password でログイン → /settings/profile でメールを別アドレス（例: changed@example.com）に変更して保存 → /settings/security を開く → /email/verify に誘導されること",
      "名前だけ変更した場合は確認済みのままであること",
      "メール変更時に確認メールが自動送信されないこと（プロフィールの再送で足りる）",
    ],
  },
  tasks: {
    "T-001": {
      title: "再現テストを書いて失敗することを確かめる",
      kind: "test",
      description:
        "ProfileUpdateTest に、メール変更で email_verified_at が null になること、大文字小文字のみの変更、名前のみ変更で確認済みのまま、メール変更後に security.edit へ GET すると verification.notice へリダイレクトされることを追加し、現状失敗することを確認する",
      refs: ["FR-001", "FR-002"],
      verifies: ["AC-001", "AC-002", "AC-003", "AC-004", "INV-001", "INV-002"],
      status: "done",
    },
    "T-002": {
      title: "プロフィール更新で確認状態を正しくリセットする",
      kind: "impl",
      description:
        "ProfileController::update でメール変更時に email_verified_at を null にして永続化し、T-001 のテストを通す",
      refs: ["FR-001", "FR-002"],
      status: "done",
    },
  },
});
