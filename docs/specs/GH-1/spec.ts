import { defineQuickSpec } from "../../sdd/schema/mod.ts";

export default defineQuickSpec({
  issue: "GH-1",
  kind: "bugfix",
  summary:
    "プロフィールでメールアドレスを変更したとき、新しいアドレスを未確認として永続化し、未確認の利用者をメール確認の案内へ回す。",
  cause: {
    reproduction: [
      "メールアドレスを確認済みの利用者でログインする",
      "`/settings/profile` でメールアドレスを別のアドレスに変えて保存する",
      "`/settings/security` を開く",
    ],
    rootCause:
      "`app/Http/Controllers/Settings/ProfileController.php` の `update` で `save()` 実行後に `email_verified_at = null` を代入しているが、再 `save()` していないため、DB 上は確認済みのまま残る。",
  },
  expected: {
    "FR-001": {
      title: "プロフィールでのメール変更時の未確認化",
      ears: {
        pattern: "event",
        trigger: "利用者がプロフィール設定でメールアドレスを変更して保存した",
        response: "新しいメールアドレスを未確認として扱わなければならない",
      },
      acceptance: [
        {
          id: "AC-001",
          kind: "normal",
          verifiedBy: "automated",
          given: ["メールアドレスが確認済みである", "利用者の現在のメールアドレスが `user@example.com` である"],
          when: "プロフィール更新でメールアドレスを `new@example.com` に変更して保存する",
          then: ["利用者の `email_verified_at` が null である"],
        },
        {
          id: "AC-004",
          kind: "error",
          verifiedBy: "automated",
          given: ["メールアドレスが確認済みである", "利用者の現在のメールアドレスが `user@example.com` である"],
          when: "プロフィール更新でメールアドレスを `not-an-email` に変更して保存する",
          then: ["バリデーションエラーが返る", "利用者の `email_verified_at` が null ではない"],
        },
      ],
      notApplicable: {
        boundary:
          "メールアドレスの変更は「変更する／しない」の二値であり、件数や上限の境界はない。",
      },
    },
    "FR-002": {
      title: "未確認時の verified 付き設定画面へのアクセス",
      ears: {
        pattern: "state",
        state: "利用者のメールアドレスが未確認である",
        response: "メール確認を要求する設定画面へのアクセスを、メール確認の案内へ回さなければならない",
      },
      acceptance: [
        {
          id: "AC-002",
          kind: "normal",
          verifiedBy: "human",
          given: ["メールアドレスが確認済みである", "利用者がプロフィールでメールアドレスを別のアドレスに変更して保存した"],
          when: "ブラウザで `/settings/security` を開く",
          then: ["セキュリティ設定画面ではなく、メールアドレスの確認を促す案内画面が表示される"],
        },
        {
          id: "AC-003",
          kind: "normal",
          verifiedBy: "automated",
          given: [
            "メールアドレスが確認済みである",
            "利用者がプロフィールでメールアドレスを `new@example.com` に変更して保存した",
          ],
          when: "`verified` ミドルウェア付きの設定画面 `security.edit` に GET する",
          then: ["`verification.notice` にリダイレクトされる"],
        },
      ],
      notApplicable: {
        boundary: "未確認状態の利用者に対するガードは、状態が未確認かどうかの二値のみである。",
        error:
          "本要件はルートへのアクセス時のリダイレクトであり、利用者が入力する操作はない。",
      },
    },
  },
  invariants: {
    "INV-001": {
      title: "メール未変更時の確認済み状態",
      behavior: "プロフィールでメールアドレスを変更せずに保存した場合、メールアドレスは確認済みのままである",
      verification: "Feature テストでメール未変更の PATCH 後に `email_verified_at` が null でないことを確かめる",
      verifiedBy: "automated",
    },
  },
  issueCoverage: [
    {
      source: "メールアドレスを変えたら、新しいアドレスは未確認として扱う",
      coveredBy: ["FR-001", "AC-001"],
    },
    {
      source:
        "未確認の間は、確認が必要な画面に入ろうとすると、メールアドレスの確認の案内（`/email/verify`）に回される",
      coveredBy: ["FR-002", "AC-002", "AC-003"],
    },
  ],
  checklist: {
    actors: {
      result: "considered",
      note: "ログイン済みの一般利用者のみ。管理者などの別ロールはない。",
    },
    dataStates: {
      result: "considered",
      note: "確認済み→メール変更後の未確認を AC-001・AC-002・AC-003 で扱う。メール未変更は INV-001。",
    },
    inputValidation: {
      result: "considered",
      note: "不正なメール形式は AC-004。",
    },
    errorFeedback: {
      result: "considered",
      note: "バリデーション失敗は AC-004（セッションエラー）。未確認時の案内は AC-002・AC-003。",
    },
    existingData: {
      result: "considered",
      note: "既存利用者のメール変更後のみ未確認化。スキーマ変更なし。",
    },
    consistency: {
      result: "considered",
      note: "issue の `/email/verify` とテストの `verification.notice` は同一の案内画面を指す。",
    },
    outOfScope: {
      result: "considered",
      note:
        "変更保存時の確認メール自動送信は対象外（プロフィール画面の既存の再送で足りる）。DB スキーマ変更なし。",
    },
  },
  conventionsCompliance: {
    "CONV-007": "該当しない: 新規 Inertia ページは追加しない。",
    "CONV-008": "該当しない: UI コンポーネントの追加・変更はない。",
    "CONV-009": "該当しない: スタイル変更はない。",
    "CONV-010": "該当しない: フロントのルート参照の変更はない。",
    "CONV-012": "Feature テストは RefreshDatabase と User ファクトリを使う（T-001）。",
  },
  approach:
    "メールが変更される場合は `save()` の前に `email_verified_at` を null にし、1 回の save で永続化する。`verified` ミドルウェアによる案内へのリダイレクトは既存のルート定義に任せる。",
  impact: {
    create: ["tests/Browser/ProfileEmailVerificationTest.php"],
    modify: [
      "app/Http/Controllers/Settings/ProfileController.php",
      "tests/Feature/Settings/ProfileUpdateTest.php",
    ],
  },
  tasks: {
    "T-001": {
      title: "再現テストを書いて失敗することを確かめる",
      kind: "test",
      description:
        "`tests/Feature/Settings/ProfileUpdateTest.php` に、メール変更で `email_verified_at` が null になること、メール変更後の `security.edit` が `verification.notice` にリダイレクトすること、不正メールで確認状態が変わらないこと、および INV-001 を確かめるテストを追加する。",
      refs: ["FR-001", "FR-002", "INV-001"],
      verifies: ["AC-001", "AC-003", "AC-004", "INV-001"],
      status: "done",
    },
    "T-002": {
      title: "プロフィール更新で未確認状態を永続化する",
      kind: "impl",
      description:
        "`ProfileController::update` でメール変更時に `save()` 前に `email_verified_at` を null にし、T-001 の Feature テストを通す。",
      refs: ["FR-001", "FR-002"],
      status: "todo",
    },
    "T-003": {
      title: "メール変更後のセキュリティ画面アクセスを E2E で確かめる",
      kind: "e2e",
      description:
        "`tests/Browser/ProfileEmailVerificationTest.php` で、確認済み利用者がプロフィールでメール変更後に `/settings/security` を開いたとき、メール確認の案内が表示されることを確かめる（AC-002）。",
      refs: ["FR-002"],
      verifies: ["AC-002"],
      status: "todo",
    },
  },
});
