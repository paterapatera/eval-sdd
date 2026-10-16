import { defineQuickSpec } from "../../sdd/schema/mod.ts";

export default defineQuickSpec({
  issue: "GH-1",
  kind: "bugfix",
  summary:
    "プロフィールでメールアドレスを変更したあと、新しいアドレスを未確認として扱い、確認が必要な設定画面へはメール確認の案内へ回す。",
  cause: {
    reproduction: [
      "メールアドレスを確認済みのユーザーでログインする",
      "/settings/profile でメールアドレスを別のアドレスに変えて保存する",
      "/settings/security を開く",
    ],
    rootCause:
      "ProfileController::update で email_verified_at を null にしているが、その変更を save していない（app/Http/Controllers/Settings/ProfileController.php 38–40 行）。DB 上は確認済みのまま残る。",
  },
  expected: {
    "FR-001": {
      title: "メール変更後の未確認扱い",
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
            "プロフィール画面に未確認である旨の案内が表示される",
          ],
        },
        {
          id: "AC-002",
          kind: "boundary",
          verifiedBy: "automated",
          given: ["メールアドレスが example@test.com で確認済みのユーザーがいる"],
          when: "プロフィール更新でメールアドレスを Example@test.com に変える",
          then: ["ユーザーの email_verified_at が null になる"],
        },
      ],
      notApplicable: {
        error: "メールアドレスの形式不正や重複は既存のバリデーションのままで、今回は変えない",
      },
    },
    "FR-002": {
      title: "未確認時の確認が必要な画面への案内",
      ears: {
        pattern: "state",
        state: "利用者のメールアドレスが未確認である",
        response: "メールアドレスの確認が必要な画面に入ろうとしたとき、メール確認の案内画面に回さなければならない",
      },
      acceptance: [
        {
          id: "AC-003",
          kind: "normal",
          verifiedBy: "human",
          given: [
            "メールアドレスを確認済みのユーザーが、プロフィールで別のメールアドレスに変えて保存した直後である",
          ],
          when: "/settings/security を開く",
          then: ["メールアドレスの確認の案内（/email/verify）の画面に移る"],
        },
      ],
      notApplicable: {
        boundary: "未確認か確認済みかの二値のみで、中間状態は無い",
        error: "未確認ユーザー向けのリダイレクトは既存の verified ミドルウェアのままで、今回は変えない",
      },
    },
  },
  invariants: {
    "INV-001": {
      title: "名前のみの更新では確認済みのまま",
      behavior: "プロフィールで名前だけを変え、メールアドレスを変えないとき、確認済みの状態は変わらない",
      verification: "ProfileUpdateTest の既存ケースと、メール未変更時の email_verified_at が残るテストが通る",
      verifiedBy: "automated",
    },
    "INV-002": {
      title: "確認メールの自動送信は行わない",
      behavior: "メールアドレスを変えただけでは、確認メールを自動送信しない（プロフィール画面の再送操作は従来どおり）",
      verification: "プロフィール更新の Feature テストで Notification が送られないことを確かめる",
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
      coveredBy: ["FR-002", "AC-003"],
    },
  ],
  checklist: {
    actors: { result: "notApplicable", note: "ログイン済み利用者のみ。権限の種類による差は無い" },
    dataStates: {
      result: "considered",
      note: "確認済み→メール変更後の未確認（AC-001, AC-003）、大文字小文字のみの変更（AC-002）、名前のみ変更（INV-001）",
    },
    inputValidation: { result: "notApplicable", note: "入力ルールは既存の ProfileUpdateRequest のまま" },
    errorFeedback: { result: "notApplicable", note: "バリデーション失敗時の表示は既存のまま" },
    existingData: { result: "notApplicable", note: "既存ユーザーの移行や一括更新は対象外" },
    consistency: {
      result: "considered",
      note: "verified ミドルウェアと既存の EmailVerificationTest のリダイレクト先と矛盾しない",
    },
    outOfScope: {
      result: "considered",
      note: "メール変更時の確認メール自動送信、architecture.ts の drift 対応、DB スキーマ変更は対象外",
    },
  },
  conventionsCompliance: {
    "CONV-007": "該当しない: 新規 Inertia ページは作らず、既存の profile / verification 画面のまま",
    "CONV-008": "該当しない: UI コンポーネントは変更しない",
    "CONV-009": "該当しない: フロントのスタイルは変更しない",
    "CONV-010": "該当しない: フロントのルート参照は変更しない",
    "CONV-012": "ProfileUpdateTest に RefreshDatabase と User ファクトリで再現・回帰テストを追加する",
  },
  approach:
    "メールアドレスが変わったときは、fill/save の前または同じ save で email_verified_at を null にし、DB に永続化する。既存の verified ミドルウェアに任せ、確認が必要なルートへの案内は変えない。",
  impact: {
    create: [],
    modify: [
      "app/Http/Controllers/Settings/ProfileController.php",
      "tests/Feature/Settings/ProfileUpdateTest.php",
      "tests/Browser/Settings/ProfileEmailVerificationTest.php",
    ],
  },
  acceptanceGuide: {
    setup: [
      { run: "./vendor/bin/sail artisan migrate --force", note: "テスト用 DB を最新にする" },
      { run: "./vendor/bin/sail npm run build", note: "フロントをビルドする" },
    ],
    accounts: [
      {
        id: "acceptance-gh1@example.com",
        password: "password",
        role: "メール確認済みの一般ユーザー（受け入れテスト用）",
      },
    ],
    data: [
      {
        acs: ["AC-001", "AC-003"],
        run: './vendor/bin/sail artisan tinker --execute=\'App\\Models\\User::query()->where("email","acceptance-gh1@example.com")->delete(); App\\Models\\User::factory()->create(["email"=>"acceptance-gh1@example.com","password"=>"password"]);\'',
        expect: "acceptance-gh1@example.com の確認済みユーザーが1件存在する",
      },
    ],
    check: [
      {
        url: "http://localhost:8000/login",
        contains: "Log in",
        note: "Sail 上でアプリが応答すること。AC-001・AC-003 は notes の手順でログインして確かめる",
      },
    ],
    notes: [
      "前提: ./vendor/bin/sail up -d で Sail が起動していること",
      "AC-001: acceptance-gh1@example.com / password でログイン → /settings/profile → Email を acceptance-gh2@example.com に変え Save → 「Your email address is unverified.」が表示される",
      "AC-003: 上記の直後に /settings/security を開く → /email/verify に移り「Resend verification email」が表示される",
    ],
  },
  tasks: {
    "T-001": {
      title: "再現テストを書いて失敗することを確かめる",
      kind: "test",
      description:
        "ProfileUpdateTest に、メール変更後に email_verified_at が null になるテスト、大文字小文字のみの変更、確認メールが自動送信されないこと、名前のみ更新で確認済みのままのテストを追加し、再現部分が失敗することを確かめる",
      refs: ["FR-001", "FR-002"],
      verifies: ["AC-002", "INV-001", "INV-002"],
      status: "done",
    },
    "T-002": {
      title: "プロフィール更新で未確認状態を保存する",
      kind: "impl",
      description:
        "ProfileController::update でメール変更時に email_verified_at を null にして保存し、T-001 のテストを通す",
      refs: ["FR-001", "FR-002"],
      status: "done",
    },
    "T-003": {
      title: "画面で未確認案内とセキュリティへのリダイレクトを E2E で確かめる",
      kind: "e2e",
      description:
        "Browser テストで、メール変更後にプロフィールに未確認の案内が出ることと、/settings/security がメール確認案内へ回ることを確かめる",
      refs: ["FR-001", "FR-002"],
      verifies: ["AC-001", "AC-003"],
      status: "done",
    },
  },
});
