import { defineQuickSpec } from "../../sdd/schema/mod.ts";

export default defineQuickSpec({
  issue: "GH-1",
  kind: "bugfix",
  summary:
    "プロフィールでメールアドレスを変更したあと、新しいアドレスを未確認として扱い、確認が必要な設定画面へは確認案内に回す。",
  cause: {
    reproduction: [
      "メールアドレスを確認済みのユーザーでログインする",
      "`/settings/profile` でメールアドレスを別のアドレスに変えて保存する",
      "`/settings/security` を開く",
    ],
    rootCause:
      "`ProfileController::update` で `save()` のあとに `wasChanged('email')` で `email_verified_at` を null にしているため、保存後は変更検知が効かず、null にしても再保存されない（`app/Http/Controllers/Settings/ProfileController.php` 35–40 行付近）。",
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
          given: ["メールアドレスが確認済みの利用者がログインしている"],
          when: "プロフィール画面でメールアドレスを別のアドレスに変えて保存する",
          then: [
            "プロフィール画面に、メールアドレスが未確認である旨の案内が表示される",
          ],
        },
        {
          id: "AC-002",
          kind: "boundary",
          verifiedBy: "automated",
          given: [
            "メールアドレスが `User@Example.com` で確認済みの利用者がいる",
          ],
          when: "プロフィール更新でメールアドレスを `user@example.com` に変えて保存する",
          then: ["利用者の `email_verified_at` が null である"],
        },
      ],
      notApplicable: {
        error:
          "不正なメール形式は既存のバリデーション（ProfileUpdateRequest）のままで、今回は変えない",
      },
    },
    "FR-002": {
      title: "未確認時の確認が必要な画面への案内",
      ears: {
        pattern: "state",
        state: "利用者のメールアドレスが未確認である",
        response:
          "確認が必要な設定画面に入ろうとしたとき、メールアドレス確認の案内画面（`/email/verify`）へ回さなければならない",
      },
      acceptance: [
        {
          id: "AC-003",
          kind: "normal",
          verifiedBy: "human",
          given: [
            "確認済みの利用者がプロフィールでメールアドレスだけを別のアドレスに変えて保存した直後である",
          ],
          when: "セキュリティ設定画面（`/settings/security`）を開こうとする",
          then: [
            "メールアドレス確認の案内画面（`/email/verify`）に移動する",
          ],
        },
      ],
      notApplicable: {
        boundary:
          "未確認か確認済みかの二状態のみで、中間の境界は無い",
        error:
          "未ログイン時の扱いは既存の認証ミドルウェアのままで、今回は変えない",
      },
    },
  },
  invariants: {
    "INV-001": {
      title: "名前だけの更新では確認済みのまま",
      behavior:
        "プロフィールで名前だけを変え、メールアドレスを変えないとき、メールアドレスは確認済みのままである",
      verification:
        "ProfileUpdateTest の既存テスト（メール未変更時に email_verified_at が null にならない）が通る",
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
    actors: { result: "notApplicable", note: "ログイン済み利用者のみ。権限の違いは無い" },
    dataStates: {
      result: "considered",
      note: "確認済み→メール変更後の未確認（AC-001, AC-003）、大文字小文字のみの変更（AC-002）",
    },
    inputValidation: {
      result: "notApplicable",
      note: "メール形式の検証は既存のまま（notApplicable.error）",
    },
    errorFeedback: {
      result: "notApplicable",
      note: "保存成功時のトーストなど、既存のフィードバックは変えない",
    },
    existingData: {
      result: "considered",
      note: "確認済みユーザーの email_verified_at をメール変更時にクリアする",
    },
    consistency: {
      result: "considered",
      note: "既存の verified ミドルウェアと EmailVerificationTest のリダイレクト先と矛盾しない",
    },
    outOfScope: {
      result: "considered",
      note: "確認メールの自動送信は求めない。architecture.ts の更新も今回は行わない",
    },
  },
  conventionsCompliance: {
    "CONV-007": "該当しない: 新規 Inertia ページは作らず、既存の settings/profile を使う",
    "CONV-008": "該当しない: UI コンポーネントの追加・複製は行わない",
    "CONV-009": "該当しない: スタイルの変更は行わない",
    "CONV-010": "該当しない: フロントのルート定義は変更しない",
    "CONV-012":
      "ProfileUpdateTest に RefreshDatabase とファクトリで再現・回帰テストを追加する",
  },
  approach:
    "プロフィール更新でメールアドレスが変わる場合、`save()` の前に `email_verified_at` を null にし、1 回の保存で永続化する。確認が必要な画面への案内は既存の verified ミドルウェアに任せ、メール変更後に未確認状態が正しく保存されることをテストで確かめる。",
  impact: {
    create: [],
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
        "ProfileUpdateTest に、確認済みユーザーがメールアドレスを変えたあと email_verified_at が null になるテストと、続けて verified ルート（security）が確認案内へリダイレクトするテストを追加し、現状失敗することを確かめる",
      refs: ["FR-001", "FR-002"],
      verifies: ["AC-002", "AC-003", "INV-001"],
      status: "todo",
    },
    "T-002": {
      title: "プロフィール更新でメール変更時に未確認へ戻す",
      kind: "impl",
      description:
        "ProfileController::update で、save 前にメール変更を検知して email_verified_at を null にし、T-001 のテストを通す",
      refs: ["FR-001", "FR-002"],
      status: "todo",
    },
    "T-003": {
      title: "画面でメール変更後の未確認表示とセキュリティ画面の案内を確かめる",
      kind: "e2e",
      description:
        "Browser テストで、プロフィールでメールを変更したあと未確認案内が出ることと、`/settings/security` が `/email/verify` に回ることを確かめる",
      refs: ["FR-001", "FR-002"],
      verifies: ["AC-001", "AC-003"],
      status: "todo",
    },
  },
});
