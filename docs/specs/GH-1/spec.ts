import { defineQuickSpec } from "../../sdd/schema/mod.ts";

export default defineQuickSpec({
  issue: "GH-1",
  kind: "bugfix",
  summary:
    "プロフィールでメールアドレスを変更したときに未確認状態を正しく保存し、未確認の利用者が確認必須の設定画面へ入れないようにする。",
  cause: {
    reproduction: [
      "メールアドレスを確認済みのユーザーでログインする",
      "`/settings/profile` でメールアドレスを別のアドレスに変えて保存する",
      "`/settings/security` を開く",
    ],
    rootCause:
      "`ProfileController::update` で `fill` と `save()` の後に `email_verified_at = null` を代入しているが、再度 `save()` していないため、DB 上では確認済みのタイムスタンプが残る（`app/Http/Controllers/Settings/ProfileController.php` 35–40 行付近）。",
  },
  expected: {
    "FR-001": {
      title: "メール変更時の未確認化",
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
          given: ["メールアドレスが確認済みの利用者がログインしている"],
          when: "プロフィール更新で別の有効なメールアドレスを送信して保存する",
          then: ["利用者の email_verified_at が null である"],
        },
        {
          id: "AC-002",
          kind: "boundary",
          verifiedBy: "automated",
          given: ["メールアドレスが確認済みの利用者がログインしている"],
          when: "プロフィール更新でメールアドレスを変えず名前だけを送信して保存する",
          then: ["利用者の email_verified_at が null ではない"],
        },
        {
          id: "AC-003",
          kind: "error",
          verifiedBy: "automated",
          given: ["メールアドレスが確認済みの利用者がログインしている"],
          when: "プロフィール更新で不正な形式のメールアドレスを送信する",
          then: [
            "バリデーションエラーとなる",
            "メールアドレスと email_verified_at は更新前のままである",
          ],
        },
      ],
    },
    "FR-002": {
      title: "未確認時の確認必須画面へのガード",
      ears: {
        pattern: "complex",
        state: "メールアドレスが未確認である",
        trigger: "利用者がメール確認を要求する設定画面を開いた",
        response: "メール確認の案内画面へ回さなければならない",
      },
      acceptance: [
        {
          id: "AC-004",
          kind: "normal",
          verifiedBy: "human",
          given: [
            "メールアドレスが確認済みの利用者がログインしている",
            "プロフィールで別の有効なメールアドレスに変更して保存した",
          ],
          when: "ブラウザで `/settings/security` を開く",
          then: ["セキュリティ設定画面ではなく、メール確認の案内画面が表示される"],
        },
        {
          id: "AC-005",
          kind: "boundary",
          verifiedBy: "automated",
          given: ["メールアドレスが未確認の利用者がログインしている"],
          when: "`verified` ミドルウェア付きの設定画面（例: 外観設定）に GET する",
          then: ["メール確認の案内ルート（verification.notice）へリダイレクトされる"],
        },
      ],
      notApplicable: {
        error: "ガードは Laravel の verified ミドルウェアの既存挙動であり、本 issue では新規の異常系を定義しない",
      },
    },
  },
  invariants: {
    "INV-001": {
      title: "メール未変更時の確認済み状態",
      behavior: "プロフィール更新でメールアドレスを変更しない場合、メールの確認済み状態は変わらない",
      verification: "tests/Feature/Settings/ProfileUpdateTest.php の既存ケースが通る",
      verifiedBy: "automated",
    },
  },
  issueCoverage: [
    {
      source: "メールアドレスを変えたら、新しいアドレスは未確認として扱う",
      coveredBy: ["FR-001"],
    },
    {
      source:
        "未確認の間は、確認が必要な画面に入ろうとすると、メールアドレスの確認の案内（`/email/verify`）に回される",
      coveredBy: ["FR-002"],
    },
  ],
  checklist: {
    actors: {
      result: "considered",
      note: "ログイン済み利用者のみ。AC-001〜AC-005 と INV-001 で扱った",
    },
    dataStates: {
      result: "considered",
      note: "確認済み・未確認を AC-001、AC-002、AC-005 で扱った",
    },
    inputValidation: {
      result: "considered",
      note: "不正なメール形式を AC-003 で扱った",
    },
    errorFeedback: {
      result: "considered",
      note: "バリデーション失敗時は既存のフォームエラー表示（AC-003）",
    },
    existingData: {
      result: "considered",
      note: "既存ユーザーの email_verified_at の扱いを FR-001・INV-001 で明示",
    },
    consistency: {
      result: "considered",
      note: "未確認時のリダイレクトは既存 EmailVerificationTest と verification.notice で整合",
    },
    outOfScope: {
      result: "considered",
      note: "メールアドレス変更時の確認メール自動送信は issue に無く対象外",
    },
  },
  conventionsCompliance: {
    "CONV-007": "該当しない: 画面の新規追加や Inertia ページの移動はない",
    "CONV-008": "該当しない: UI コンポーネントの追加・複製はない",
    "CONV-009": "該当しない: スタイル変更はない",
    "CONV-010": "該当しない: フロントのルート・フォーム URL の変更はない",
    "CONV-012": "Feature / Browser テストは RefreshDatabase と User ファクトリを使う（T-001、T-003）",
  },
  approach:
    "メールアドレスが変わる場合は save の前に email_verified_at を null にし、1 回の save でメールと確認状態をまとめて永続化する。ガードは既存の verified ミドルウェアに任せる。",
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
        "ProfileUpdateTest にメール変更で email_verified_at が null になること、不正メールで状態が変わらないこと、メール変更後に verified 付きルートへリダイレクトされることを追加する。",
      refs: ["FR-001", "FR-002", "INV-001"],
      verifies: ["AC-001", "AC-002", "AC-003", "AC-005", "INV-001"],
      status: "done",
    },
    "T-002": {
      title: "プロフィール更新で未確認状態を永続化する",
      kind: "impl",
      description:
        "ProfileController::update でメール変更時に email_verified_at を null にしてから save し、T-001 の Feature テストを通す。",
      refs: ["FR-001", "FR-002"],
      status: "todo",
    },
    "T-003": {
      title: "メール変更後のセキュリティ画面ガードを E2E で確かめる",
      kind: "e2e",
      description:
        "Browser テストで、メール変更保存後に /settings/security を開いたときメール確認案内が表示されることを AC-004 として確かめる。",
      refs: ["FR-002"],
      verifies: ["AC-004"],
      status: "todo",
    },
  },
});
