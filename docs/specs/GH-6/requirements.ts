import { defineRequirements } from "../../sdd/schema/mod.ts";

export default defineRequirements({
  issue: "GH-6",
  summary:
    "プロフィール設定で自己紹介（bio）を保存でき、メール確認済みの利用者が他者の名前・自己紹介・利用開始月をメンバーページ（/members/<ユーザーID>）で閲覧できるようにする。",
  functional: {
    "FR-001": {
      title: "プロフィール設定で自己紹介を保存する",
      ears: {
        pattern: "event",
        trigger: "ログイン済みの利用者がプロフィール設定で名前・メールアドレスとともに自己紹介を送信した",
        response: "自己紹介を保存し、既存のプロフィール更新と同様に成功を伝えなければならない",
      },
      acceptance: [
        {
          id: "AC-001",
          kind: "normal",
          verifiedBy: "human",
          given: [
            "ログイン済みの利用者がいる",
            "プロフィール設定画面を開いている",
          ],
          when: "自己紹介に「テスト用の自己紹介です」と入力し、名前とメールアドレスを現在の値のまま保存する",
          then: [
            "自己紹介の入力欄にラベル「Bio」が表示される",
            "保存が成功したことが分かるフィードバックが表示される",
            "プロフィール設定画面を再度開いたとき、自己紹介の入力欄に「テスト用の自己紹介です」と表示される",
          ],
        },
        {
          id: "AC-002",
          kind: "boundary",
          verifiedBy: "automated",
          given: ["ログイン済みの利用者がいる"],
          when: "自己紹介に160文字の文字列を含めて PATCH /settings/profile を送る",
          then: ["バリデーションエラーにならず、自己紹介が保存される"],
        },
        {
          id: "AC-003",
          kind: "error",
          verifiedBy: "automated",
          given: ["ログイン済みの利用者がいる"],
          when: "自己紹介に161文字の文字列を含めて PATCH /settings/profile を送る",
          then: ["バリデーションエラーとなり、自己紹介は更新されない"],
        },
        {
          id: "AC-010",
          kind: "boundary",
          verifiedBy: "automated",
          given: ["ログイン済みの利用者がいる"],
          when: "自己紹介を空文字のまま name と email を含めて PATCH /settings/profile を送る",
          then: ["バリデーションエラーにならず、自己紹介は空として保存される"],
        },
      ],
      priority: "must",
    },
    "FR-002": {
      title: "メンバーページで他利用者のプロフィールを表示する",
      ears: {
        pattern: "event",
        trigger: "利用者が /members/<ユーザーID> にアクセスした",
        response: "その利用者の公開プロフィール情報を表示しなければならない",
      },
      acceptance: [
        {
          id: "AC-004",
          kind: "normal",
          verifiedBy: "human",
          given: [
            "閲覧者がログイン済みかつメール確認済みである",
            "表示対象の利用者が存在し、名前が「山田太郎」、自己紹介が「よろしくお願いします」と保存されている",
            "表示対象の利用者のアカウント作成日時が 2026-10-05 である",
          ],
          when: "閲覧者が /members/<表示対象のユーザーID> を開く",
          then: [
            "画面に「山田太郎」と表示される",
            "画面に「よろしくお願いします」と表示される",
            "画面に「2026年10月から利用」と表示される",
            "メールアドレスは表示されない",
          ],
        },
        {
          id: "AC-005",
          kind: "boundary",
          verifiedBy: "human",
          given: [
            "閲覧者がログイン済みかつメール確認済みである",
            "表示対象の利用者が存在し、自己紹介が未入力（空）である",
          ],
          when: "閲覧者が /members/<表示対象のユーザーID> を開く",
          then: ["画面に「自己紹介はまだありません」と表示される"],
        },
        {
          id: "AC-011",
          kind: "normal",
          verifiedBy: "human",
          given: [
            "閲覧者がログイン済みかつメール確認済みである",
            "表示対象の利用者の自己紹介が「1行目\\n2行目」と保存されている",
          ],
          when: "閲覧者が /members/<表示対象のユーザーID> を開く",
          then: [
            "画面の自己紹介の表示で「1行目」と「2行目」が別の行として表示される",
          ],
        },
        {
          id: "AC-006",
          kind: "error",
          verifiedBy: "automated",
          given: [
            "閲覧者がログイン済みかつメール確認済みである",
            "指定したユーザーIDの利用者が存在しない",
          ],
          when: "閲覧者が /members/999999999 を開く",
          then: [
            "HTTP 404 となる",
          ],
        },
      ],
      priority: "must",
    },
    "FR-003": {
      title: "メンバーページの閲覧権限",
      ears: {
        pattern: "state",
        state: "利用者がログインしていない、またはメールアドレスが未確認である",
        response: "メンバーページを表示せず、ログインまたはメール確認を促す画面へ案内しなければならない",
      },
      acceptance: [
        {
          id: "AC-007",
          kind: "normal",
          verifiedBy: "automated",
          given: ["利用者がログイン済みかつメール確認済みである", "表示対象の利用者が存在する"],
          when: "GET /members/<表示対象のユーザーID> を送る",
          then: ["HTTP 200 となる"],
        },
        {
          id: "AC-008",
          kind: "error",
          verifiedBy: "automated",
          given: ["利用者がログインしていない"],
          when: "GET /members/1 を送る",
          then: ["ログイン画面へリダイレクトされる"],
        },
        {
          id: "AC-009",
          kind: "error",
          verifiedBy: "automated",
          given: ["利用者がログイン済みだがメールアドレスが未確認である"],
          when: "GET /members/1 を送る",
          then: ["メール確認を促す画面へリダイレクトされる"],
        },
      ],
      notApplicable: {
        boundary: "閲覧可否の二値のみで、件数や上限の境界はない",
      },
      priority: "must",
    },
  },
  nonFunctional: {},
  invariants: {
    "INV-001": {
      title: "名前・メールのみのプロフィール更新",
      behavior:
        "PATCH /settings/profile に name と email だけを送ったとき、従来どおり名前・メールが更新され、メール変更時のみメール確認状態がリセットされ、profile.edit へリダイレクトされる",
      verification: "tests/Feature/Settings/ProfileUpdateTest の既存ケースが通る",
      verifiedBy: "automated",
    },
    "INV-002": {
      title: "プロフィール設定画面の認証",
      behavior: "未ログインの利用者は GET /settings/profile および PATCH /settings/profile を利用できない",
      verification: "tests/Feature/Settings/ProfileUpdateTest および認証ミドルウェアの既存挙動",
      verifiedBy: "automated",
    },
  },
  nfrReview: {
    可用性: { decision: "baseline" },
    "性能・拡張性": {
      decision: "notApplicable",
      reason: "単一利用者のプロフィール表示・更新のみで、性能目標の変更はない",
    },
    "運用・保守性": { decision: "baseline" },
    移行性: {
      decision: "baseline",
      note: "既存利用者の bio は未設定（空）として扱う。checklist.existingData を参照",
    },
    セキュリティ: {
      decision: "baseline",
      note: "メンバーページは名前・自己紹介・利用開始の月のみ。メールアドレスは表示しない（AC-004）",
    },
    "システム環境・エコロジー": { decision: "baseline" },
  },
  issueCoverage: [],
  checklist: {
    actors: {
      result: "considered",
      note: "プロフィール設定はログイン必須、メンバーページはログイン＋メール確認済み必須（FR-003、AC-007〜AC-009）",
    },
    dataStates: {
      result: "considered",
      note: "自己紹介未入力を AC-005、最大文字数を AC-002・AC-003、存在しないユーザーIDを AC-006 で扱う",
    },
    inputValidation: {
      result: "considered",
      note: "bio は任意・最大160文字（AC-002、AC-003、AC-010）。パスのユーザーIDは AC-006",
    },
    errorFeedback: {
      result: "considered",
      note: "プロフィール保存の成功は既存のトーストに合わせる。バリデーションはフィールドエラー。存在しないメンバーは 404",
    },
    existingData: {
      result: "considered",
      note: "既存ユーザーの bio は空。名前・メールの更新フローは INV-001 で維持",
    },
    consistency: {
      result: "considered",
      note: "issue の bio 項目名と PATCH /settings/profile を要件全体で統一",
    },
    outOfScope: {
      result: "considered",
      note: "issue.md の対象外を outOfScope に列挙",
    },
  },
  assumptions: [
    "ユーザーIDは users テーブルの数値 id を URL の <ユーザーID> に使う",
    "プロフィール設定のルートは既存の /settings/profile（profile.edit / profile.update）を拡張する",
    "メンバーページはログイン済みかつメール確認済みの利用者のみ閲覧できる（dashboard と同じ auth + verified）",
    "利用開始の月はアカウント作成日時（created_at）の年と月を使い、「YYYY年M月から利用」と表示する（例: 2026年10月から利用）",
    "自己紹介（bio）は任意で、最大160文字",
    "メンバーページでは自己紹介の改行をそのまま表示する",
    "プロフィール設定の自己紹介欄は既存の Name / Email と同様に英語ラベル（Bio）で表示する（利用者が明示指定しなかったため推奨案を採用）",
  ],
  openQuestions: [],
  outOfScope: [
    "メンバーの一覧や検索",
    "プロフィールの画像",
    "自己紹介へのコメントやいいね",
  ],
});
