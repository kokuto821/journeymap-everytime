## Context

現状 `src/ui/` は種類別フォルダの平置き(`MapView/MapView.tsx`・`MapView/LayerSwitcher.tsx`・`theme/ThemeSwitch.tsx`)。テストは実装ファイルと同階層の `_test_/` に置く運用が既に定着している(CLAUDE.md記載どおり)。Storybookは未導入。ビルドツールは Vite(`vite: ^8.2.0`)、React 19、TypeScript 6。詳細は proposal.md - Why を参照。

## Goals / Non-Goals

**Goals:**
- `src/ui/` を 1 コンポーネント = 1 フォルダ構成に再編し、`_test_/`・`_storybook_/` を各フォルダ配下に揃える。
- `@storybook/react-vite` で Storybook を導入し、既存 Vite 設定をそのまま流用する。
- 既存 3 コンポーネントを新構成へ移行し、stories を用意する。
- CLAUDE.md に本プロジェクト固有ルールとharness-kit一般ルールとの優先関係を明記する。

**Non-Goals:**
- `src/ui/state/`(`useThemeStore.ts` 等のストア)のフォルダ再編は対象外。コンポーネントではないため。
- Storybook の Visual Regression Testing・Chromatic 等の追加ツール連携は対象外(導入のみが今回のスコープ)。
- 既存コンポーネントの振る舞い変更・リファクタは対象外(ファイル移動と import パス追随のみ)。

## Decisions

### 1コンポーネント=1フォルダへの再編は1つの change/PRでまとめて行う

対象は `MapView`・`LayerSwitcher`・`ThemeSwitch` の3コンポーネントのみで、変更規模が小さいため分割の恩恵が薄い。ファイル移動は相互に独立しており、途中状態で壊れても影響範囲が小さい。分割すると「フォルダ構成ルール確定」と「移行完了」の間に中途半端な混在状態を跨ぎ、かえって見通しが悪くなる。

### `MapView/` フォルダの分割方針

`MapView/` は現在 `MapView.tsx` と `LayerSwitcher.tsx` の2コンポーネントが同居している。1コンポーネント=1フォルダ原則に従い、`src/ui/MapView/MapView.tsx` と `src/ui/LayerSwitcher/LayerSwitcher.tsx` に分割する。`gameMapCrs.ts`・`useTileLayerUrl.ts` は `MapView.tsx` 専用のヘルパーのため `MapView/` 配下に残す。

### Storybook のビルダーは `@storybook/react-vite`

本プロジェクトは Vite ベース(`vite.config.ts`)。Webpack ビルダーを別途導入すると設定が二重管理になる。`@storybook/react-vite` は既存の Vite 設定をそのまま利用できる。

### Storybook のバージョンは最新の安定版(10.x系)を採用

React 19・Vite 8・TypeScript 6という比較的新しい依存構成のため、対応が新しい最新版を採用する。導入時点の npm registry 最新版を `npm install` 時に解決させ、`package.json` にはキャレット範囲で記録する。

### `_storybook_/` サブフォルダ方式(コロケーション方式を採用しない)

claude-harness-kit 一般ルールは `*.stories.tsx` を実装ファイルと同一フォルダに直置きするコロケーション方式を規定するが、本プロジェクトは `_test_/` を既に同様のサブフォルダ方式で運用しており、テストとの一貫性を優先する。CLAUDE.md にこの逸脱と優先関係を明記し、harness-kit 側のルールを上書きする(issue #56 の要件どおり)。

## Risks / Trade-offs

- [`MapView/` 分割で import パスが変わり、テストヘルパー(`_test_/helpers/`)の相対パスも追随が必要] → 移行時に `grep` で参照箇所を洗い出し、機械的に一括修正する。
- [harness-kit 一般ルールとの矛盾が将来的なプラグイン更新で見落とされる] → CLAUDE.md に矛盾と優先関係を明記することで運用時に参照される状態にする(issue要件どおり)。
- [Storybook 導入で `package.json`・`node_modules` が肥大化する] → MVP個人開発であり許容範囲。CI/CDが無い運用(手動デプロイ)のためビルド時間増もローカル開発の範囲に留まる。

## Migration Plan

1. Storybook 導入(`npx storybook@latest init` 相当の依存追加 + `.storybook/` 設定)。
2. `ThemeSwitch` → `LayerSwitcher` → `MapView` の順で、依存の少ないコンポーネントからフォルダ移行する。各コンポーネントごとに移動・import修正・テスト実行・stories作成をワンセットで行う。
3. 全コンポーネント移行後、CLAUDE.md にルールを追記する。
4. ロールバックは git revert で対応可能(段階的コミットのため)。
