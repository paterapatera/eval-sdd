import { defineRequirements } from "../../sdd/schema/mod.ts";

export default defineRequirements({
  issue: "GH-5",
  summary:
    "ログイン成功時に利用者ごとの記録を残し、ログインしている利用者が設定画面 `/settings/login-history` で自分の記録だけを一覧できるようにする。",
  functional: {
    "FR-001": {
      title: "ログイン成功時の記録",
      ears: {
        pattern: "event",
        trigger: "利用者がログインフロー全体に成功し、アプリのセッションが開始された",
        response: "その利用者に紐づくログイン記録を1件追加しなければならない",
      },
      acceptance: [
        {
          id: "AC-001",
          kind: "normal",
          verifiedBy: "automated",
          given: [
            "利用者Aが存在し、ログイン記録は0件である",
            "利用者Aは二要素認証を設定していない",
            "利用者Aが正しいメールとパスワードでログインに成功する",
          ],
          when: "ログイン処理が完了し、セッションが開始される",
          then: [
            "利用者Aのログイン記録が1件増える",
            "その記録にはログイン日時と接続元IPアドレスが含まれる",
          ],
        },
        {
          id: "AC-002",
          kind: "boundary",
          verifiedBy: "automated",
          given: [
            "利用者Aは二要素認証を有効にしている",
            "利用者Aが正しいメールとパスワードを送信し、二要素チャレンジ画面が表示されている",
            "この時点で利用者Aのログイン記録は0件である",
          ],
          when: "利用者Aがまだ二要素の確認コードを送信していない",
          then: ["利用者Aのログイン記録は0件のままである"],
        },
        {
          id: "AC-010",
          kind: "normal",
          verifiedBy: "automated",
          given: [
            "利用者Aは二要素認証を有効にしている",
            "利用者Aが正しいメールとパスワードを送信したあと、正しい二要素確認コードでチャレンジに成功する",
            "チャレンジ成功前の利用者Aのログイン記録は0件である",
          ],
          when: "二要素チャレンジが成功し、セッションが開始される",
          then: ["利用者Aのログイン記録が1件だけ増える"],
        },
        {
          id: "AC-011",
          kind: "boundary",
          verifiedBy: "automated",
          given: [
            "利用者Aが存在する",
            "この機能のリリースより前に行われたログインは記録されていない",
          ],
          when: "利用者Aが初めてこの機能リリース後にログインに成功する",
          then: [
            "利用者Aのログイン記録は1件だけである",
            "過去のログインが遡って記録されない",
          ],
        },
        {
          id: "AC-003",
          kind: "error",
          verifiedBy: "automated",
          given: ["利用者Aが存在する"],
          when: "利用者Aが誤ったパスワードでログインを試み、認証に失敗する",
          then: ["利用者Aのログイン記録は増えない"],
        },
      ],
      priority: "must",
    },
    "FR-002": {
      title: "ログイン履歴画面",
      ears: {
        pattern: "state",
        state: "ログインしている利用者が `/settings/login-history` を開いている",
        response:
          "その利用者自身のログイン記録を、ログイン日時の新しい順に最大10件まで一覧表示しなければならない",
      },
      acceptance: [
        {
          id: "AC-004",
          kind: "normal",
          verifiedBy: "human",
          given: [
            "利用者Aがログインしている",
            "利用者Aのログイン記録が2件あり、内容が互いに異なる",
          ],
          when: "利用者Aが `/settings/login-history` を開く",
          then: [
            "利用者Aの2件のログイン記録が新しい順に表示される",
            "各記録のログイン日時は `YYYY-MM-DD HH:mm` 形式（24時間制）で日本時間として表示される",
            "各記録に接続元IPアドレスが表示される",
            "他の利用者の記録は表示されない",
          ],
        },
        {
          id: "AC-012",
          kind: "boundary",
          verifiedBy: "human",
          given: [
            "利用者Aがログインしている",
            "利用者Aのログイン記録が11件あり、ログイン日時がすべて異なる",
          ],
          when: "利用者Aが `/settings/login-history` を開く",
          then: [
            "一覧には10件だけが表示される",
            "表示されている10件は、ログイン日時が最も新しい10件である",
            "11件目に古い記録は一覧に表示されない",
          ],
        },
        {
          id: "AC-005",
          kind: "boundary",
          verifiedBy: "human",
          given: [
            "利用者Aがログインしている",
            "利用者Aのログイン記録が0件である",
          ],
          when: "利用者Aが `/settings/login-history` を開く",
          then: ["「ログイン履歴はありません」と表示される"],
        },
        {
          id: "AC-014",
          kind: "normal",
          verifiedBy: "automated",
          given: [
            "利用者Aがログインしている",
            "利用者Aのメールアドレスは未確認である",
          ],
          when: "利用者Aが `/settings/login-history` にGETする",
          then: ["HTTP 200 でログイン履歴画面が返る"],
        },
        {
          id: "AC-006",
          kind: "error",
          verifiedBy: "automated",
          given: ["利用者Aがログアウトしている"],
          when: "利用者Aが `/settings/login-history` にGETする",
          then: ["ログイン画面へリダイレクトされる"],
        },
      ],
      priority: "must",
    },
    "FR-003": {
      title: "設定画面からの導線",
      ears: {
        pattern: "state",
        state: "ログインしている利用者が設定画面のナビゲーションを見ている",
        response: "ログイン履歴画面へ移動できる項目を表示しなければならない",
      },
      acceptance: [
        {
          id: "AC-007",
          kind: "normal",
          verifiedBy: "human",
          given: ["利用者Aがログインしている"],
          when: "利用者Aが `/settings/profile` を開く",
          then: ["設定のナビゲーションに「ログイン履歴」の項目が表示される"],
        },
        {
          id: "AC-008",
          kind: "normal",
          verifiedBy: "human",
          given: ["利用者Aがログインしている"],
          when: "利用者Aが設定のナビゲーションで「ログイン履歴」を選ぶ",
          then: ["`/settings/login-history` が表示される"],
        },
        {
          id: "AC-009",
          kind: "error",
          verifiedBy: "automated",
          given: ["利用者Aがログアウトしている"],
          when: "利用者Aが `/settings/profile` にGETする",
          then: ["ログイン画面へリダイレクトされる"],
        },
      ],
      notApplicable: {
        boundary: "ナビゲーション項目の件数に上限はなく、境界となる件数はない",
      },
      priority: "must",
    },
  },
  nonFunctional: {},
  invariants: {
    "INV-001": {
      title: "既存のログイン成功後の遷移",
      behavior:
        "メールとパスワードによるログイン（二要素認証の設定がある場合はその完了後）が成功したとき、利用者は従来どおりダッシュボード（またはアプリ既定のログイン後画面）へ遷移できる",
      verification: "既存の認証 Feature テストが、期待する遷移先を変えずに通る",
      verifiedBy: "automated",
    },
    "INV-002": {
      title: "既存の設定画面のルート",
      behavior:
        "`/settings/profile`、`/settings/security`、`/settings/appearance` のURLと、認証・メール確認・パスワード再確認の要否は、本issue以前と同じである",
      verification: "既存の Settings / Profile の Feature テストが通る",
      verifiedBy: "automated",
    },
    "INV-003": {
      title: "他利用者の記録へのアクセス",
      behavior:
        "ある利用者がログイン履歴を取得・表示する操作で、別の利用者のログイン記録を見ることはできない",
      verification: "Feature テストで、利用者Aのセッションから利用者Bの記録が返らないことを確かめる",
      verifiedBy: "automated",
    },
  },
  nfrReview: {
    可用性: { decision: "baseline" },
    "性能・拡張性": {
      decision: "notApplicable",
      reason: "一覧表示の件数上限は機能要件の受け入れ条件で決め、性能目標の追加はしない",
    },
    "運用・保守性": {
      decision: "baseline",
      waived: { "BNFR-002": "本 issue は CI ワークフローと composer ci:check の対象を変えない" },
    },
    移行性: {
      decision: "notApplicable",
      reason: "過去ログインは記録しないため、既存データの移行はない",
    },
    セキュリティ: {
      decision: "baseline",
      note: "自分の記録のみ閲覧・記録漏れなしは機能要件と INV-003 で扱う",
    },
    "システム環境・エコロジー": {
      decision: "baseline",
      waived: { "BNFR-001": "本 issue は phpunit.xml の DB 接続設定を変えない" },
    },
  },
  issueCoverage: [],
  checklist: {
    actors: {
      result: "considered",
      note:
        "ログイン済み利用者のみ閲覧（AC-006）。メール未確認でも閲覧可（AC-014、プロフィール設定と同様）。管理者向け画面は outOfScope",
    },
    dataStates: {
      result: "considered",
      note: "0件は AC-005、複数件は AC-004、表示上限10件は AC-012",
    },
    inputValidation: {
      result: "considered",
      note:
        "本画面は一覧表示のみで利用者入力はない。URL直アクセスの未認証は AC-006",
    },
    errorFeedback: {
      result: "considered",
      note: "未認証時は既存と同様ログイン画面へリダイレクト（AC-006）",
    },
    existingData: {
      result: "considered",
      note: "リリース前のログインは記録・表示しない（AC-011、issue 原文）",
    },
    consistency: {
      result: "considered",
      note: "1件の記録はログイン日時と接続元IPのみ。ナビは「ログイン履歴」",
    },
    outOfScope: {
      result: "considered",
      note: "issue の「やらないこと」および古い記録の削除・保存上限を outOfScope に列挙",
    },
  },
  assumptions: [
    "ログイン記録は、ログインフロー全体の成功時に1件だけ追加する。二要素認証利用者は確認コードまで成功したときに記録し、パスワードのみ通過してチャレンジ待ちの段階では記録しない",
    "ログイン日時の画面表示は `YYYY-MM-DD HH:mm` 形式（24時間制。例: `2026-10-11 09:30`）とし、常に日本時間（Asia/Tokyo）で表示する。利用者のブラウザのタイムゾーン設定は使わない",
    "ログイン履歴画面には最新10件だけを表示し、ページネーションは使わない",
    "設定ナビの表示名は「ログイン履歴」",
    "ログイン履歴画面へのアクセスは `/settings/profile` と同様、`auth` ミドルウェアのみでよく、メールアドレス確認（verified）は必須にしない",
    "ログイン履歴画面へのアクセスに、Security 画面のようなパスワード再確認（RequirePassword）は求めない",
  ],
  openQuestions: [],
  outOfScope: [
    "不審なログインの通知（メールなど）",
    "ほかの端末のログインを終わらせる操作",
    "管理者がほかの利用者の記録を見る画面",
    "この issue より前に行われたログインの記録や表示",
    "古いログイン記録を削除するか、保存件数の上限を設けるかの決定",
  ],
});
