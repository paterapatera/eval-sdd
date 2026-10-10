import { defineAdr } from "../schema/mod.ts";

export default defineAdr({
  id: "ADR-0001",
  title: "PHP 品質ゲート（Pint・PHPStan・Deptrac・jscpd）を維持する",
  status: "accepted",
  date: "2026-10-10",
  context:
    "コードレビューに頼らず品質を担保するため、リポジトリに既に composer scripts と CI で PHP 向けのゲートが揃っている。",
  decision:
    "既存の Laravel Pint、PHPStan（level max + 拡張）、Deptrac、jscpd をそのまま品質ゲートとし、SDD の commands.check に composer check:php を含める。",
  consequences:
    "新規コードも同じ基準を満たす必要がある。モジュール追加時は Deptrac のレイヤー定義の更新が必要になる場合がある。",
  alternatives: [
    {
      option: "PHPStan の level を下げる",
      reason: "既存設定を変えず、ゲートを弱めない方針のため不採用。",
    },
    {
      option: "PHPat など別の境界ツールに置き換え",
      reason: "Deptrac が既に導入・設定済みのため不採用。",
    },
  ],
});
