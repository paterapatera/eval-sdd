import { defineQuickSpec } from "../../sdd/schema/mod.ts";

export default defineQuickSpec({
  issue: "GH-1",
  kind: "bugfix",
  summary:
    "プロフィールでメールアドレスを変更したとき、確認済み状態を解除して保存し、未確認の間は確認が必要な設定画面へ入れないようにする。",
  cause: {
    reproduction: [
      "メールアドレスを確認済みのユーザーでログインする",
      "/settings/profile でメールアドレスを別のアドレスに変えて保存する",
      "/settings/security を開く",
    ],
    rootCause:
      "ProfileController::update で email_verified_at を null にしているが、その変更を save() していない（app/Http/Controllers/Settings/ProfileController.php 35–40 行付近）。",
  },
  expected: {
    "FR-001": {
      title: "メールアドレス変更時の確認状態",
      ears: {
        pattern: "event",
        trigger: "利用者がプロフィール画面でメールアドレスを変えて保存した",
        response: "新しいメールアドレスを未確認として扱わなければならない",
      },
      acceptance: [
        {
          id: "AC-001",
          kind: "normal",
          verifiedBy: "human",
          given: ["メールアドレスが確認済みのユーザーでログインしている"],
          when: "/settings/profile でメールアドレスを別のアドレスに変えて保存する",
          then: [
            "プロフィール画面に、メールアドレスが未確認である旨の案内が表示される",
          ],
        },
        {
          id: "AC-002",
          kind: "normal",
          verifiedBy: "automated",
          given: ["メールアドレスが確認済みのユーザーがいる"],
          when: "プロフィール更新でメールアドレスだけを別のアドレスに変える",
          then: ["ユーザーの email_verified_at が null になる"],
        },
        {
          id: "AC-003",
          kind: "boundary",
          verifiedBy: "automated",
          given: ["メールアドレスが確認済みのユーザーがいる"],
          when: "プロフィール更新でメールアドレスの大文字と小文字だけを変える",
          then: ["ユーザーの email_verified_at が null になる"],
        },
      ],
      notApplicable: {
        error: "不正なメール形式は既存のバリデーションで拒否され、今回の不具合の範囲外",
      },
    },
    "FR-002": {
      title: "未確認時の確認が必要な画面へのアクセス",
      ears: {
        pattern: "state",
        state: "利用者のメールアドレスが未確認である",
        response:
          "確認が必要な設定画面に入ろうとしたとき、メールアドレス確認の案内画面へ移すなければならない",
      },
      acceptance: [
        {
          id: "AC-004",
          kind: "normal",
          verifiedBy: "human",
          given: [
            "メールアドレスを変更した直後で、新しいアドレスは未確認である",
          ],
          when: "/settings/security を開こうとする",
          then: ["メールアドレス確認の案内画面（/email/verify）が表示される"],
        },
        {
          id: "AC-005",
          kind: "normal",
          verifiedBy: "automated",
          given: ["プロフィール更新でメールアドレスを変え、email_verified_at が null になったユーザー"],
          when: "GET /settings/security にアクセスする",
          then: ["メールアドレス確認の案内（verification.notice）へリダイレクトされる"],
        },
      ],
      notApplicable: {
        boundary: "verified ミドルウェアの有無は二値であり、中間状態は無い",
        error: "未ログイン時のアクセスは既存の auth ミドルウェアの範囲",
      },
    },
  },
  invariants: {
    "INV-001": {
      title: "名前のみ変更したときの確認状態",
      behavior:
        "プロフィールで名前だけを変え、メールアドレスを変えなければ、メールアドレスは確認済みのまま",
      verification: "ProfileUpdateTest の既存ケースが通る",
      verifiedBy: "automated",
    },
  },
  issueCoverage: [
    {
      source: "メールアドレスを変えたら、新しいアドレスは未確認として扱う",
      coveredBy: ["FR-001", "AC-001", "AC-002", "AC-003"],
    },
    {
      source:
        "未確認の間は、確認が必要な画面に入ろうとすると、メールアドレスの確認の案内（`/email/verify`）に回される",
      coveredBy: ["FR-002", "AC-004", "AC-005"],
    },
  ],
  checklist: {
    actors: { result: "notApplicable", note: "ログイン済み利用者のみ" },
    dataStates: {
      result: "considered",
      note: "確認済み→メール変更後の未確認（AC-001〜005）、大文字小文字のみの変更（AC-003）",
    },
    inputValidation: {
      result: "notApplicable",
      note: "メール形式の検証は既存の ProfileUpdateRequest のまま",
    },
    errorFeedback: {
      result: "notApplicable",
      note: "保存成功時のトーストなど既存の表示は変えない",
    },
    existingData: {
      result: "notApplicable",
      note: "スキーマ変更なし。既存ユーザーの email_verified_at を一括更新しない",
    },
    consistency: {
      result: "considered",
      note: "verified ミドルウェアと EmailVerificationTest のリダイレクト先と一致させる",
    },
    outOfScope: {
      result: "considered",
      note: "メール変更時の確認メール自動送信は求めない（既存の再送で足りる）",
    },
  },
  conventionsCompliance: {
    "CONV-007": "該当しない: 新規 Inertia ページは追加しない",
    "CONV-008": "該当しない: UI コンポーネントの追加・変更なし",
    "CONV-009": "該当しない: フロントのスタイル変更なし",
    "CONV-010": "該当しない: フロントのルート参照を追加しない",
    "CONV-012": "ProfileUpdateTest に RefreshDatabase とファクトリでデータを用意する",
  },
  approach:
    "保存前に isDirty('email') を見て email_verified_at を null にし、1 回の save() でメールと確認状態をまとめて永続化する。メール変更後の security へのリダイレクトは verified ミドルウェアに任せ、Feature テストで確かめる。",
  impact: {
    create: ["tests/Browser/ProfileEmailVerificationTest.php"],
    modify: [
      "app/Http/Controllers/Settings/ProfileController.php",
      "tests/Feature/Settings/ProfileUpdateTest.php",
    ],
  },
  acceptanceGuide: {
    setup: [
      {
        run: "./vendor/bin/sail artisan migrate --force",
        note: "テスト用 DB を最新にする",
      },
      {
        run: "./vendor/bin/sail npm run build",
        note: "フロントのビルド（Sail 上のアプリ表示用）",
      },
    ],
    accounts: [
      {
        id: "acceptance-verified@example.com",
        password: "password",
        role: "確認済みの一般ユーザー（data のコマンドで作成）",
      },
    ],
    data: [
      {
        acs: ["AC-001", "AC-004"],
        run: './vendor/bin/sail artisan tinker --execute="\\App\\Models\\User::query()->where(\'email\', \'acceptance-verified@example.com\')->delete(); \\App\\Models\\User::factory()->create([\'email\' => \'acceptance-verified@example.com\']);"',
        expect:
          "acceptance-verified@example.com / password でログインでき、email_verified_at が null でない",
      },
    ],
    check: [
      {
        url: "http://localhost:8000/login",
        contains: "Log in",
        note: "Sail が http://localhost:8000 で応答していること（APP_URL と一致）",
      },
    ],
    notes: [
      "人が確かめる AC-001: acceptance-verified@example.com でログイン → /settings/profile でメールを changed-acceptance@example.com に変えて Save → 「Your email address is unverified.」が表示される",
      "人が確かめる AC-004: 上記の直後に /settings/security を開く → /email/verify に移り「Resend verification email」が表示される",
      "名前だけ変更した場合（INV-001）は Feature テストで自動確認済み",
    ],
  },
  tasks: {
    "T-001": {
      title: "再現テストを書いて失敗することを確かめる",
      kind: "test",
      description:
        "ProfileUpdateTest に、メール変更で email_verified_at が null になること、大文字小文字のみの変更でも null になること、変更後に security.edit へ GET すると verification.notice へリダイレクトされることを追加し、修正前は失敗することを確かめる",
      refs: ["FR-001", "FR-002"],
      verifies: ["AC-002", "AC-003", "AC-005", "INV-001"],
      status: "done",
    },
    "T-002": {
      title: "プロフィール更新で確認状態を正しく保存する",
      kind: "impl",
      description:
        "ProfileController::update でメール変更時に save 前に email_verified_at を null にし、T-001 のテストを通す",
      refs: ["FR-001", "FR-002"],
      status: "done",
    },
    "T-003": {
      title: "受け入れ条件の E2E を追加する",
      kind: "e2e",
      description:
        "Browser テストで、メール変更後にプロフィール画面に未確認案内が出ること（AC-001）と、/settings/security へ行くと /email/verify の案内になること（AC-004）を確かめる",
      refs: ["FR-001", "FR-002"],
      verifies: ["AC-001", "AC-004"],
      status: "done",
    },
  },
});
