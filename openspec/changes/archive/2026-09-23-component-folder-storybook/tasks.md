## 1. Storybook導入

- [x] 1.1 `@storybook/react-vite` 等必要な依存を追加し、`.storybook/` 設定一式(`main.ts`・`preview.ts`)を作成する。既存の Vite 設定(`vite.config.ts`)と整合させる
- [x] 1.2 `package.json` に Storybook 起動用スクリプトを追加し、`npm run storybook` で正常起動することを確認する

## 2. ThemeSwitch のフォルダ移行

- [x] 2.1 `src/ui/theme/ThemeSwitch.tsx` を `src/ui/ThemeSwitch/ThemeSwitch.tsx` へ移動し、`_test_/` 配下のテスト・ヘルパーも `src/ui/ThemeSwitch/_test_/` へ移動、import パスを修正する。移行後に `npm run test` が通ることを確認する
- [x] 2.2 `src/ui/ThemeSwitch/_storybook_/ThemeSwitch.stories.tsx` を新規作成する

## 3. LayerSwitcher のフォルダ移行

- [x] 3.1 `src/ui/MapView/LayerSwitcher.tsx` を `src/ui/LayerSwitcher/LayerSwitcher.tsx` へ移動し、対応するテスト・ヘルパーを `src/ui/LayerSwitcher/_test_/` へ移動、import パスを修正する。移行後に `npm run test` が通ることを確認する
- [x] 3.2 `src/ui/LayerSwitcher/_storybook_/LayerSwitcher.stories.tsx` を新規作成する

## 4. MapView のフォルダ移行

- [x] 4.1 `src/ui/MapView/MapView.tsx`・`gameMapCrs.ts`・`useTileLayerUrl.ts` と対応するテスト・ヘルパーを `src/ui/MapView/` 配下の新構成(`_test_/` 配置)に合わせて整理する(既に同階層のため、`LayerSwitcher` 分離後の残存ファイルとテストの整合のみ確認・修正する)。移行後に `npm run test` が通ることを確認する
- [x] 4.2 `src/ui/MapView/_storybook_/MapView.stories.tsx` を新規作成する

## 5. ドキュメント更新

- [x] 5.1 CLAUDE.md に、`src/ui/` のフォルダ構成ルール(1コンポーネント=1フォルダ、`_test_/`・`_storybook_/` サブフォルダ)と、新規コンポーネント作成時の stories 作成義務を追記する
- [x] 5.2 CLAUDE.md に、claude-harness-kit 一般ルール(コロケーション方式)との矛盾点と、本プロジェクトでは `_storybook_` サブフォルダ分離方式を優先する旨を明記する

## 6. 全体確認

- [x] 6.1 `npm run build`・`npm run lint`・`npm run test` を通し、フォルダ移行後もビルド・型チェック・lint・テストが全て通ることを確認する
