import { defineQuickSpec } from "../../sdd/schema/mod.ts";

export default defineQuickSpec({
  issue: "GH-1",
  kind: "bugfix",
  summary:
    "プロフィールでメールアドレスを変更したとき、新しいアドレスを未確認として保存し、確認が必要な設定画面ではメール確認の案内へ回す。",
  cause: {
    reproduction: [
      "メールアドレスを確認済みの利用者でログインする",
      "`/settings/profile` でメールアドレスを別のアドレスに変えて保存する",
      "`/settings/security` を開く",
    ],
    rootCause:
      "`app/Http/Controllers/Settings/ProfileController.php` の `update`（35–40行）で、先に `save()` した後に `email_verified_at = null` を代入しているが再 `save()` していないため、DB には確認済みのタイムスタンプが残る。",
  },
  expected: {
    "FR-001": {
      title: "メール変更時の未確認記録",
      ears: {
        pattern: "event",
        trigger: "利用者がプロフィール設定でメールアドレスを変更して保存した",
        response: "新しいメールアドレスを未確認として記録しなければならない",
      },
      acceptance: [
        {
          id: "AC-001",
          kind: "normal",
          verifiedBy: "automated",
          given: ["メールアドレスが確認済みである利用者がログインしている"],
          when: "利用者が PATCH `/settings/profile` で別の有効なメールアドレスに変更して保存する",
          then: [
            "利用者の `email` が新しい値である",
            "利用者の `email_verified_at` が null である",
          ],
        },
        {
          id: "AC-003",
          kind: "error",
          verifiedBy: "automated",
          given: ["メールアドレスが確認済みである利用者がログインしている"],
          when: "利用者が PATCH `/settings/profile` で不正な形式のメールアドレスを送信する",
          then: [
            "バリデーションエラーが返る",
            "利用者の `email_verified_at` は null にならない",
          ],
        },
        {
          id: "AC-004",
          kind: "normal",
          verifiedBy: "automated",
          given: ["メールアドレスが確認済みである利用者がログインしている"],
          when: "利用者が PATCH `/settings/profile` でメールアドレスを変えずに名前だけ更新する",
          then: ["利用者の `email_verified_at` が null にならない"],
        },
      ],
      notApplicable: {
        boundary:
          "メール変更は変更あり・なしの二値であり、未変更時は AC-004 と INV-001 で扱う。件数や上限の境界はない。",
      },
    },
    "FR-002": {
      title: "未確認時の確認案内への誘導",
      ears: {
        pattern: "state",
        state: "利用者のメールアドレスが未確認である",
        response:
          "利用者がメール確認を要求する設定画面にアクセスしたとき、メール確認の案内画面へ回さなければならない",
      },
      acceptance: [
        {
          id: "AC-002",
          kind: "normal",
          verifiedBy: "human",
          given: [
            "メールアドレスが確認済みであった利用者がログインしている",
            "利用者がプロフィールでメールアドレスを別のアドレスに変えて保存した",
          ],
          when: "利用者が `/settings/security` を開く",
          then: [
            "メール確認の案内画面が表示される",
            "セキュリティ設定画面は表示されない",
          ],
        },
        {
          id: "AC-005",
          kind: "normal",
          verifiedBy: "automated",
          given: ["メールアドレスが未確認の利用者がログインしている"],
          when: "利用者が `verified` ミドルウェア付きの設定画面（`appearance.edit`）に GET する",
          then: ["メール確認の案内（`verification.notice`）へリダイレクトされる"],
        },
      ],
      notApplicable: {
        error:
          "未確認利用者の `verified` ルートアクセスはリダイレクトが期待結果であり、本 issue の異常系は FR-001 のメール形式バリデーション（AC-003）で扱う。",
        boundary: "確認状態は確認済み・未確認の二値であり、件数の境界はない。",
      },
    },
  },
  invariants: {
    "INV-001": {
      title: "メール未変更時の確認済み維持",
      behavior: "プロフィール更新でメールアドレスを変更しない場合、確認済み状態を維持する",
      verification: "Feature テストでメール未変更の PATCH 後に `email_verified_at` が null にならないことを確かめる",
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
      coveredBy: ["FR-002", "AC-002", "AC-005"],
    },
  ],
  checklist: {
    actors: {
      result: "considered",
      note: "確認済み利用者がメール変更し、未確認の間に verified 付き設定へアクセスする流れを AC で扱った。",
    },
    dataStates: {
      result: "considered",
      note: "確認済み・未確認の二状態と、メール変更あり・なしを AC-001/004/005 と INV-001 で扱った。",
    },
    inputValidation: {
      result: "considered",
      note: "不正メール形式は AC-003 で扱い、確認状態が変わらないことを確かめる。",
    },
    errorFeedback: {
      result: "notApplicable",
      note: "バリデーションエラーの表示文言は既存のプロフィール更新のまま。本 issue は確認状態の永続化の不具合修正。",
    },
    existingData: {
      result: "notApplicable",
      note: "DB スキーマ変更なし。既存利用者のメールは変更操作時のみ未確認化する。",
    },
    consistency: {
      result: "considered",
      note: "issue の `/email/verify` とルート名 `verification.notice` を FR-002・AC-005 で一致させた。",
    },
    outOfScope: {
      result: "considered",
      note: "メール変更保存時の確認メール自動送信は行わない（プロフィール画面の既存再送のまま）。",
    },
  },
  conventionsCompliance: {
    "CONV-007": "該当しない: Inertia ページやルートの新規追加はない。",
    "CONV-008": "該当しない: UI コンポーネントの変更はない。",
    "CONV-009": "該当しない: スタイル変更はない。",
    "CONV-010": "該当しない: フロントのルート連携の変更はない。",
    "CONV-012":
      "Feature テストは `tests/Feature/Settings/ProfileUpdateTest.php` に追加し、RefreshDatabase と User ファクトリを使う。",
  },
  approach:
    "メールアドレスが変更される場合は `save()` の前に `email_verified_at` を null に設定し、1 回の save でメールと確認状態をまとめて永続化する。`verified` ミドルウェアと `routes/settings.php` のルート分割は既存のまま利用する。",
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
        "`ProfileUpdateTest` にメール変更で `email_verified_at` が null になるテストと、変更後に `security.edit` が `verification.notice` へリダイレクトするテストを追加する。AC-003・AC-005・INV-001 も同ファイルまたは既存の `EmailVerificationTest` で確かめる。",
      refs: ["FR-001", "FR-002", "INV-001"],
      verifies: ["AC-001", "AC-003", "AC-004", "AC-005", "INV-001"],
      status: "done",
    },
    "T-002": {
      title: "プロフィール更新で未確認状態を永続化する",
      kind: "impl",
      description:
        "`ProfileController::update` でメール変更時に `save()` 前へ `email_verified_at` の null 設定を移し、T-001 の Feature テストを通す。",
      refs: ["FR-001", "FR-002"],
      status: "todo",
    },
    "T-003": {
      title: "メール変更後のセキュリティ画面アクセスを E2E で確かめる",
      kind: "e2e",
      description:
        "`tests/Browser/ProfileEmailVerificationTest.php` で、確認済み利用者がプロフィールでメール変更後に `/settings/security` を開いたとき、メール確認の案内が表示されることを確かめる。",
      refs: ["FR-002"],
      verifies: ["AC-002"],
      status: "todo",
    },
  },
});
