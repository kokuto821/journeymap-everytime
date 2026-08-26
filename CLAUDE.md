# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Minecraft JourneyMap(Java Edition用Mod)が生成する地図タイルを、マインクラフト未起動時でもブラウザから閲覧できるようにする個人開発Webアプリ(MVP)。

詳細な要件・スコープ・技術選定理由は `要件定義書_マイクラMAPエディター_v0.3.md` を参照する。特に以下は実装判断に直結するため把握しておくこと。

- MVP(v1.0)はタイル画像の閲覧のみが対象。waypoint表示・編集機能は含まない(v1.1以降)。
- 認証機構は無し。推測困難なURLのみで非公開運用する方針(セキュリティ実装を追加する場合は要件定義書9章の方針と矛盾しないか確認する)。
- バックエンド・DBは持たない。タイル画像・JSONはCloudflare R2に静的ファイルとして格納し、フロントエンドから直接読み込む構成。
- データのエクスポート・デプロイはローカルPC上のスクリプトで手動実行する運用(CI/CDは使用しない)。

現状、リポジトリは Vite の `react-ts` テンプレートを初期化した直後の状態で、地図表示などのアプリケーション機能は未実装。

## 開発コマンド

```bash
npm install            # 依存関係インストール
npm run dev             # 開発サーバー起動(デフォルト http://localhost:5173、使用中なら別ポートに自動フォールバック)
npm run build            # 型チェック(tsc -b) + 本番ビルド
npm run preview           # ビルド成果物のプレビュー
npm run test             # テストを1回実行(Vitest)
npm run test:watch        # テストをwatchモードで実行
npm run lint             # ESLintでチェック
npm run lint:fix          # ESLintで自動修正
npm run format            # Prettierでファイルを整形
npm run format:check       # 整形崩れのチェックのみ(修正しない)
```

テストは Vitest。`src/`(jsdom環境、React Testing Library)と `scripts/`(Node環境)を `vitest.config.ts` の `projects` で分離し、`npm run test` で一括実行する。テストファイルは実装と同じディレクトリに `*.test.ts(x)` として置く。テストケースは `it` ではなく `test` を使う。

## アーキテクチャ

- **フロントエンド**: Vite + React + TypeScript。要件定義書の技術構成(10章)ではタイル表示に Leaflet を使う方針(JourneyMapのXYZタイル構造との親和性を優先)。React配下での導入は react-leaflet 等を想定するが未導入。
- **ビルド設定**: `vite.config.ts`(Vite本体)、`vitest.config.ts`(テスト実行専用。Vite本体の設定とは分離している)、`tsconfig.json` が `tsconfig.app.json`(アプリコード用)と `tsconfig.node.json`(Vite/Vitest設定・`scripts/`配下など Node 実行コード用)を参照するプロジェクト分割構成。
- **Lint/Format**: `eslint.config.js` は flat config。`js.configs.recommended` + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` に加え、配列末尾で `eslint-config-prettier/flat` を適用し、ESLintのスタイル系ルールとPrettierの競合を無効化している。ESLintはコード品質、Prettierはフォーマット専用という役割分担。
- **`.prettierignore`** は `*.md` を除外している。日本語ドキュメント(README、要件定義書)がPrettierの対象になると意図しない差分が入るため。ドキュメント系ファイルを新設する場合もこの除外に従う。
- **データ/インフラ(将来実装分、要件定義書10章)**: ホスティングは Cloudflare Pages(フロント配信)+ Cloudflare R2(タイル等の静的データ、約168MB)。必要に応じて Cloudflare Workers。エクスポート/デプロイは JourneyMapのローカルデータ(`.minecraft/journeymap/data`)を読み取るローカルスクリプトと Wrangler CLI 等で行う想定(このリポジトリにはまだスクリプト本体は無い)。

## openspec(仕様駆動開発)

このリポジトリは [OpenSpec](https://github.com/Fission-AI/OpenSpec) (`@fission-ai/openspec`, グローバルインストール)で初期化済み。`openspec/config.yaml` の `schema: spec-driven` に従う。

- `openspec/specs/`: 確定した仕様
- `openspec/changes/`: 変更提案(ADDED/MODIFIED/REMOVEDのデルタ形式)。`openspec/changes/archive/` にアーカイブ済みの変更が入る
### ワークフロー

1. **探索**(任意): 要件が固まっていない場合は `openspec-explore` で壁打ちする
2. **提案**: `openspec-propose` で `openspec/changes/<name>/` に proposal.md・design.md・specs delta・tasks.md 一式を生成する
3. **提案の見直し**(任意): 起票済みの提案を直すときは手で編集せず `openspec-update-change` に通す。アーティファクト間の整合を保ったまま更新される
4. **実装**: `openspec-apply-change` で tasks.md を1つずつ消化する
5. **反映**:
   - 実装まで終えた変更は `openspec-archive-change` で `openspec/specs/` へマージし `openspec/changes/archive/` へ格納する
   - 実装を伴わずスペックだけ本流に取り込みたい場合は `openspec-sync-specs` を使う

`openspec-*`(グローバルスキル)と `/opsx:*`(例: `/opsx:propose`。このリポジトリのスラッシュコマンド)は同一の内容を指す。どちらを使ってもよい。

既存コードの後追いスペック化は避け、これから変更する部分だけを段階的にスペック化する方針。

## タスクの進め方（issue駆動開発）
1. ユーザーが要望を伝える
2. issueを作成
3. issue用の作業ブランチを作成
4. 対応方針詳細検討
5. TDDの方式で実装（RED：テスト実装、GEEEN：最低限の実装、REFACTOR：コードレビュー・実装）
6. セルフレビュー・修正（5に戻る）
7. PR作成
8. コードレビュー
9. マージ