## Why

`src/ui/` はコンポーネント種類別の平置きで、コンポーネント単位の凝集が弱い(例: `MapView/` フォルダに `MapView.tsx` と `LayerSwitcher.tsx` が同居)。また Storybook が未導入で、UI コンポーネントを単体で目視確認・育成する環境がない(issue #56)。

## What Changes

- `src/ui/` 配下を「1コンポーネント = 1フォルダ」構成へ再編する(例: `src/ui/MapView/MapView.tsx`)。
- 各コンポーネントフォルダ配下に `_test_/`・`_storybook_/` サブフォルダを持たせる(`_test_/` は既存運用の踏襲、`_storybook_/` は新設)。
- `@storybook/react-vite` 等の依存を追加し、`.storybook/` 設定一式を導入する。
- 既存コンポーネント(`MapView`, `LayerSwitcher`, `ThemeSwitch`)を新構成へ移行し、各コンポーネントに `_storybook_/*.stories.tsx` を作成する。
- CLAUDE.md に、新規コンポーネント作成時の `_storybook_/*.stories.tsx` 作成義務と、本プロジェクト固有のフォルダ構成ルールを追記する。
- CLAUDE.md に、claude-harness-kit 一般ルール(`shared-rules/coding-conventions/coding-rule.md`, `shared-rules/ui-design/architecture/ui-architecture.md` が規定するコロケーション方式)との矛盾と、本プロジェクトでは `_storybook_` サブフォルダ分離方式を優先する旨を明記する。

## Capabilities

このリリースは既存機能のユーザー向け振る舞いを変更しない、ファイル構成の再編・開発ツール導入・ドキュメント整備のみのため、新規/変更 capability は無い(`skip_specs: true` を `.openspec.yaml` に設定済み)。

### New Capabilities
(なし)

### Modified Capabilities
(なし)

## Impact

- **影響コード**: `src/ui/` 配下の全コンポーネントファイル(`MapView.tsx`, `LayerSwitcher.tsx`, `ThemeSwitch.tsx`)とそのテスト(`_test_/` 配下、import パスの追随が必要)。
- **設定**: `package.json`(Storybook 関連依存の追加)、`.storybook/`(新規)。
- **ドキュメント**: `CLAUDE.md`(フォルダ構成ルール・Storybook義務化ルール・harness-kit一般ルールとの優先関係の明記)。
- **対象外**: `src/ui/state/`(`useThemeStore.ts` 等のストア)は UI コンポーネントではないため本 issue のフォルダ再編対象に含めない。
