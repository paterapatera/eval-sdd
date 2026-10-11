import { defineDesign } from "../../sdd/schema/mod.ts";
import type requirements from "./requirements.ts";

export default defineDesign<typeof requirements>()({
  overview:
    "users テーブルに nullable の bio（最大160文字）を追加し、既存のプロフィール更新フローで保存する。" +
    "メール確認済みの利用者向けに MemberProfileController と Inertia ページ members/show で /members/{user} を提供し、" +
    "公開用 props には名前・自己紹介表示文・利用開始ラベルのみ渡す（メールは含めない）。",
  asIs:
    "User は name・email 等のみ。ProfileValidationRules は name/email のみ検証。settings/profile は Name/Email のフォーム。" +
    "メンバー向け公開プロフィールのルート・画面は無い。dashboard 等は auth+verified ミドルウェア。",
  toBe:
    "bio 列と検証（nullable|string|max:160）を追加。プロフィール画面に Bio（textarea）を追加。" +
    "web.php の auth+verified グループに GET members/{user} を追加し、MemberProfileController が Inertia members/show を返す。",
  components: {
    User: {
      kind: "modified",
      responsibility: "bio の永続化と Fillable/Hidden/PHPDoc の更新",
      files: ["app/Models/User.php"],
      asIs: "fillable は name, email, password。bio 列は無い。",
    },
    ProfileValidationRules: {
      kind: "modified",
      responsibility: "profileRules に bio（nullable・最大160文字）の検証を追加",
      files: ["app/Concerns/ProfileValidationRules.php"],
      asIs: "name と email のルールのみ。",
    },
    ProfileController: {
      kind: "modified",
      responsibility: "PATCH で validated に bio を含め fill/save（既存のメール変更・リダイレクト・トーストは維持）",
      files: ["app/Http/Controllers/Settings/ProfileController.php"],
      asIs: "ProfileUpdateRequest の validated を fill するのみ。",
    },
    MemberProfileController: {
      kind: "new",
      responsibility:
        "存在する User をルートモデル結合で解決し、公開用 props（name・bioDisplay・memberSinceLabel）だけを Inertia に渡す",
      files: ["app/Http/Controllers/MemberProfileController.php"],
    },
    ProfileSettingsPage: {
      kind: "modified",
      responsibility: "Bio ラベルの textarea、maxLength 160、Wayfinder フォーム送信",
      files: ["resources/js/pages/settings/profile.tsx"],
      asIs: "Name/Email の Input のみ。",
    },
    MemberShowPage: {
      kind: "new",
      responsibility: "名前・利用開始ラベル・自己紹介（pre-wrap）を表示。メールは props に無い",
      files: ["resources/js/pages/members/show.tsx"],
    },
    Textarea: {
      kind: "new",
      responsibility: "Input と同系の Tailwind スタイルの multiline 入力",
      files: ["resources/js/components/ui/textarea.tsx"],
    },
    AddBioToUsersTable: {
      kind: "new",
      responsibility: "users.bio を nullable string(160) で追加",
      files: ["database/migrations/2026_10_11_000000_add_bio_to_users_table.php"],
    },
  },
  dependencies: [
    { from: "ProfileController", to: "ProfileValidationRules", label: "ProfileUpdateRequest 経由で検証" },
    { from: "ProfileController", to: "User", label: "プロフィール保存" },
    { from: "ProfileSettingsPage", to: "ProfileController", label: "Wayfinder update フォーム" },
    { from: "ProfileSettingsPage", to: "Textarea", label: "bio 入力" },
    { from: "MemberProfileController", to: "User", label: "公開プロフィールの読み取り" },
    { from: "MemberShowPage", to: "MemberProfileController", label: "Inertia props の表示" },
    { from: "User", to: "AddBioToUsersTable", label: "スキーマ" },
  ],
  interfaces: {
    "PATCH /settings/profile": {
      component: "ProfileController",
      kind: "http",
      change: "modified",
      signature:
        "PATCH /settings/profile — body: { name: string, email: string, bio?: string|null } — 302 profile.edit、バリデーション失敗時 422",
      description: "既存の名前・メール更新に bio を追加。bio は省略可・空文字可・最大160文字。",
      compatibility:
        "フロントは bio を送るようにする。bio 無しの PATCH は引き続き有効（INV-001）。呼び出し元は ProfileSettingsPage と Feature テスト。",
    },
    "GET /members/{user}": {
      component: "MemberProfileController",
      kind: "http",
      change: "new",
      signature:
        "GET /members/{user} — middleware: auth, verified — 200 Inertia members/show、未存在 user は 404",
      description:
        "Inertia props: member: { id, name, bioDisplay, memberSinceLabel }。bioDisplay は空なら「自己紹介はまだありません」。memberSinceLabel は created_at から「Y年n月から利用」。",
    },
    "MemberProfileController::show": {
      component: "MemberProfileController",
      kind: "function",
      change: "new",
      signature: "public function show(User $user): \\Inertia\\Response",
      description: "ルートモデル結合。公開フィールドのみ組み立てて Inertia::render('members/show', ...)。",
    },
    "ProfileValidationRules::profileRules": {
      component: "ProfileValidationRules",
      kind: "function",
      change: "modified",
      signature: "protected function profileRules(?int $userId = null): array — returns rules incl. bio => ['nullable','string','max:160']",
      description: "name/email ルールに bio を追加。",
      compatibility: "ProfileUpdateRequest のみが利用。追加キーは後方互換。",
    },
  },
  dataModels: {
    "users.bio": {
      kind: "modified",
      description: "利用者の自己紹介（公開）。最大160文字、未設定は NULL。",
      definition: "bio VARCHAR(160) NULL（users テーブル）",
      migration:
        "新規マイグレーションで bio 列を nullable string(160) として追加。既存行は NULL（空の自己紹介として扱う）。down で列削除。",
    },
  },
  errorHandling: [
    {
      case: "bio が161文字以上で PATCH /settings/profile",
      handling: "Laravel バリデーションで 422 と errors.bio。DB は更新しない。",
      refs: ["AC-003"],
    },
    {
      case: "存在しないユーザー ID で GET /members/{user}",
      handling: "ルートモデル結合の ModelNotFoundException により 404。",
      refs: ["AC-006"],
    },
    {
      case: "未ログインで GET /members/{user}",
      handling: "auth ミドルウェアにより login ルートへリダイレクト。",
      refs: ["AC-008"],
    },
    {
      case: "ログイン済みだがメール未確認で GET /members/{user}",
      handling: "verified ミドルウェアにより verification.notice へリダイレクト（既存と同じ）。",
      refs: ["AC-009"],
    },
  ],
  impact: {
    create: [
      "database/migrations/2026_10_11_000000_add_bio_to_users_table.php",
      "app/Http/Controllers/MemberProfileController.php",
      "resources/js/pages/members/show.tsx",
      "resources/js/components/ui/textarea.tsx",
      "tests/Feature/Members/MemberProfileShowTest.php",
    ],
    modify: [
      "app/Models/User.php",
      "app/Concerns/ProfileValidationRules.php",
      "app/Http/Controllers/Settings/ProfileController.php",
      "resources/js/pages/settings/profile.tsx",
      "resources/js/types/auth.ts",
      "routes/web.php",
      "database/factories/UserFactory.php",
      "tests/Feature/Settings/ProfileUpdateTest.php",
    ],
  },
  decisions: [
    {
      title: "bio 入力 UI",
      decidedBy: "ai",
      context: "改行を保持する要件があり、既存は Input のみ。ui/textarea は未整備。",
      decision:
        "shadcn 系と同様の resources/js/components/ui/textarea.tsx を新規追加し、ProfileSettingsPage で使用（新規 npm 依存は無し）。",
      alternatives: [
        { option: "Input type=text の1行", reason: "改行を保持できない" },
        { option: "ページ内に生の <textarea> を直書き", reason: "共通 ui コンポーネントを増やさずスタイルが散らばる" },
      ],
      adr: false,
    },
    {
      title: "メンバーページへの公開データ",
      decidedBy: "ai",
      context: "メール非表示（AC-004）と Inertia の props 漏洩を防ぐ必要がある。",
      decision:
        "MemberProfileController で member 配列のみ渡す。email は含めない。bio は表示用に bioDisplay（空ならプレースホルダー文言）をサーバーで決定。",
      alternatives: [
        { option: "User モデルをそのまま Inertia に渡す", reason: "email 等が漏れる" },
        { option: "API Resource クラスを新設", reason: "単一画面のため過剰" },
      ],
      adr: false,
    },
    {
      title: "利用開始ラベルの生成",
      decidedBy: "ai",
      context: "要件は「YYYY年M月から利用」。表示はメンバーページのみ。",
      decision:
        "MemberProfileController 内で created_at を app タイムゾーンに変換し、format('Y年n月から利用') で memberSinceLabel を生成。",
      alternatives: [
        { option: "フロントで Date 整形", reason: "要件の文言をサーバーで固定しやすいのは PHP 側" },
      ],
      adr: false,
    },
    {
      title: "メンバールートの解決",
      decidedBy: "ai",
      context: "存在しない ID で 404（AC-006）が必要。",
      decision: "Route::get('members/{user}', ...) で User の暗黙的ルートモデル結合を使用。",
      alternatives: [
        { option: "手動 findOrFail", reason: "結合と同等で冗長" },
      ],
      adr: false,
    },
  ],
  traceability: {
    "FR-001": [
      "User",
      "ProfileValidationRules",
      "ProfileController",
      "ProfileSettingsPage",
      "Textarea",
      "AddBioToUsersTable",
    ],
    "FR-002": ["MemberProfileController", "MemberShowPage", "User"],
    "FR-003": ["MemberProfileController", "MemberShowPage"],
  },
  nfrStrategy: {},
  invariantStrategy: {
    "INV-001":
      "ProfileUpdateRequest の rules は bio を nullable にし、テストで name/email のみ PATCH が従来どおり通ることを維持。ProfileController の email 変更時の verified リセットと redirect は変更しない。",
    "INV-002":
      "settings ルートの auth ミドルウェアは変更しない。ProfileController のルート定義は routes/settings.php のまま。",
  },
  conventionsCompliance: {
    "CONV-007":
      "members/show.tsx を resources/js/pages/members/ に置き、Inertia::render('members/show') と一致させる。",
    "CONV-008":
      "Bio 入力は新規 Textarea ui コンポーネントを使い、MemberShowPage は Heading 等の既存レイアウト部品で構成する。",
    "CONV-009":
      "Tailwind ユーティリティと cn() で Textarea・MemberShowPage をスタイルする。自己紹介表示は whitespace-pre-wrap。",
    "CONV-010":
      "プロフィール更新は ProfileController.update の Wayfinder フォームを継続。メンバーページ URL は wayfinder:generate 後の @/routes の members.show を使う。",
    "CONV-012":
      "tests/Feature/Members/MemberProfileShowTest.php と ProfileUpdateTest の拡張で RefreshDatabase と UserFactory を使う。",
  },
  checklist: {
    conventions: {
      result: "considered",
      note: "Settings/Profile と dashboard の auth+verified・Inertia ページ構成に合わせた（ProfileController、web.php、pages/）",
    },
    security: {
      result: "considered",
      note: "members は verified 必須。Inertia props に email を含めない。bio は max:160 で検証。",
    },
    dataIntegrity: {
      result: "considered",
      note: "bio 更新は単一 User の fill/save。同時更新の特別処理は不要。",
    },
    performance: {
      result: "considered",
      note: "メンバー表示は User 1件の主キー取得のみ。N+1 なし。",
    },
    observability: {
      result: "notApplicable",
      note: "新規の監査ログ要件なし。Laravel 既定の例外・バリデーションに任せる。",
    },
    testability: {
      result: "considered",
      note: "Feature テストで HTTP と DB を検証。created_at は factory で固定可能。",
    },
    rollback: {
      result: "considered",
      note: "マイグレーション down で bio 列削除。ルート・画面を revert すれば機能無効化。",
    },
    sharedFiles: {
      result: "considered",
      note: "routes/web.php と users マイグレーションのみ共有。モジュール境界は AppShell 内。",
    },
  },
  risks: [
    "HandleInertiaRequests の auth.user に bio が含まれるため、ログイン中はクライアントに自分の bio が常に渡る（email と同様の共有データ）。",
  ],
});
