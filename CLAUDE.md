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

テストは Vitest。`src/`(jsdom環境、React Testing Library)と `scripts/`(Node環境)を `vitest.config.ts` の `projects` で分離し、`npm run test` で一括実行する。テストファイルは実装と同じディレクトリに `*.test.ts(x)` として置く。テストケースは `it` ではなく `test` を使い、本体は Arrange / Act / Assert の3ブロックに分けて `// Arrange` `// Act` `// Assert` のコメントで区切る(該当するブロックが無い場合はそのコメントを省く)。テスト名は「○○したら△△する」形式で、1テスト1 Actを原則とする。

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

OpenSpecのフェーズ進行は claude-harness-kit の `openspec-workflow` スキルが統括する。各フェーズで起動するスキルは以下。

| フェーズ | 起動するスキル | 内容 |
|---|---|---|
| 探索(任意) | `openspec-explore` | 要件が固まっていない場合の壁打ち |
| 提案 | `openspec-propose` | `openspec/changes/<name>/` に proposal.md・design.md・specs delta・tasks.md 一式を生成する |
| 提案の見直し(任意) | `openspec-update-change` | 起票済みの提案を直すときは手で編集せずこれに通す。アーティファクト間の整合を保ったまま更新される |
| 実装 | **`openspec-workflow`**(`openspec-apply-change` は直接起動しない) | tasks.md の未完了タスクを1件ずつ取り出し、実装は産出スキル(`tdd` / `coding` / `test-coding`)へ委譲する |
| 反映 | **`openspec-workflow`**(`openspec-archive-change` / `openspec-sync-specs` は直接起動しない) | レビューゲートを通した後、実装まで終えた変更を `openspec/specs/` へマージし `openspec/changes/archive/` へ格納する。実装を伴わずスペックだけ本流に取り込む場合は sync を使う |

- 実装・反映のフェーズで CLI生成の `openspec-apply-change` / `openspec-archive-change` / `openspec-sync-specs` を**直接起動しない**。これらは産出スキルへの委譲表もレビューゲートも持たないため、必ず `openspec-workflow` 経由にする(根拠: claude-harness-kit の `shared-rules/openspec-integration/openspec-rule.md`)。
- `openspec-*`(グローバルスキル)と `/opsx:*`(例: `/opsx:propose`。このリポジトリのスラッシュコマンド)は同一の内容を指す。どちらを使ってもよい。
- そもそもOpenSpecを使うかどうかの判断基準は `openspec-rule` §いつ OpenSpec の propose を使うか に従う(下記「タスクの進め方」手順4)。
- 既存コードの後追いスペック化は避け、これから変更する部分だけを段階的にスペック化する方針。

## タスクの進め方（issue駆動開発）

このリポジトリの開発フローは、claude-harness-kit プラグイン(`.claude/settings.json` で有効化済み)のルール・スキルに従う。**判断基準の本文はここに再掲せず、以下を唯一の正とする。**

| 対象 | 参照先(claude-harness-kit内のパス) |
|---|---|
| issue化の判断・粒度・ブランチ運用・GitHub操作の承認 | `shared-rules/issue-driven-development/issue-driven-rule.md` |
| OpenSpecを使うかの判断・フェーズ対応・レビュー独立性 | `shared-rules/openspec-integration/openspec-rule.md` |
| TDDサイクル(List-Red-Green-Refactor-Commit)とコーディング標準 | `shared-rules/coding-conventions/tdd-rule.md` |
| レビュワーと産出者を分ける原則 | `rules/harness-engineering/review-independence-rule.md` |
| 実行フェーズ全体の手順 | `skills/github-issue-resolve/SKILL.md` |
| OpenSpecのフェーズ進行・実装委譲・レビューゲート | `skills/openspec-workflow/SKILL.md` |
| TDDサイクルの進行 | `skills/tdd/SKILL.md` |

### 手順とスキルの対応

1. **ユーザーが要望を伝える**
2. **issueを作成** — `github-issue-create`(作成フェーズ)。ここで一旦区切り、同じやり取りの流れで実装に進まない
3. **issue用の作業ブランチを作成** — `github-issue-resolve` の SELECT / BRANCH フェーズ。**手順4の方針検討より前に**ブランチへ移る
4. **対応方針詳細検討** — `github-issue-resolve` の PLAN フェーズ
   - **OpenSpecを使うかを最初に判断する**。基準は `openspec-rule` §いつ OpenSpec の propose を使うか の表(方針の候補が複数ある/後戻りが高コスト/複数capabilityにまたがる → 使う。方針が一択で完了条件がその場で1〜3行にまとまる → 使わない)
   - **使う場合**: `openspec-workflow` の PROPOSE フェーズ(= `openspec-propose`)で `openspec/changes/<name>/` に proposal.md・design.md・specs delta・tasks.md を生成し、内容を提示して承認を得る。修正は `openspec-update-change`
   - **使わない場合**: 対話で完了条件を1〜3行にまとめて合意する
   - いずれも**合意を得るまで実装に入らない**
5. **TDDの方式で実装** — `github-issue-resolve` の IMPLEMENT フェーズ
   - **OpenSpecを使った場合**: `openspec-workflow` の APPLY フェーズが tasks.md の未完了タスク(`- [ ]`)を1件ずつ取り出す。**tasks.md のタスク1件につき `tdd` スキルを1サイクル**(List → Red → Green → Refactor → Commit)実行し、1サイクル終えるごとに該当タスクを `- [x]` に更新する
   - **使わなかった場合**: issueの完了条件の1項目を1サイクルの単位とする
   - 委譲先は変更の性質で決まる(テストを伴うコード実装 → `tdd` / 伴わないコード実装 → `coding` / テストコードのみ → `test-coding` / 上記に該当しないmd資産 → 委譲先なし)。表は `github-issue-resolve` 手順4
   - タスクが曖昧、実装がタスク・specの範囲を超える場合は、その場で範囲を広げずユーザーに確認する
6. **セルフレビュー・修正** — `github-issue-resolve` の REVIEW フェーズ。手順5内のRefactorとは**対象と粒度が異なり、重複しない**

   | | 手順5内の Refactor フェーズ | 手順6 セルフレビュー |
   |---|---|---|
   | 粒度 | TDDサイクル1周 | issue単位(PR単位) |
   | 対象 | 直前のRed/Greenで書いたコードのみ | 全サイクルを経た変更全体 |
   | 起動するスキル | `coding-review` | `coding-review`(実装・テスト) / `ai-engineering-review`(md資産) / `ui-review`(UI実装) |
   | 停止条件 | 1ラウンドで打ち切り、残る指摘は次サイクルのRefactorへ送る | 最大2ラウンド。残る指摘は別issueに切り出すか残課題として報告する |

   - どちらも**レビューは産出者と別エージェントが行い、指摘の適用は産出者に戻す**。修正後の再検証も修正した本人に委ねない(`review-independence-rule`)
   - OpenSpecを使った場合、`openspec-workflow` の REVIEW ゲートがこの工程にあたる。**このレビューを経ずに手順7のARCHIVEへ進まない**
7. **PR作成** — 先に `openspec/specs/` を確定させてから `github-issue-resolve` の COMMIT / PR フェーズへ進む
   - **全タスク完了後・PR作成前**に、`openspec-workflow` の ARCHIVE フェーズで `openspec/changes/<name>/` を `openspec/specs/` へマージし `openspec/changes/archive/` へ格納する(手順6のレビュー完了が前提)
   - 実装を伴わずスペックだけ本流に取り込む場合は sync(`openspec-sync-specs`)を使う
   - PR本文に `Closes #<番号>` を含める
8. **コードレビュー**
9. **マージ** — `github-issue-resolve` の MERGE / CLOSE フェーズ。完了条件と実際の変更を1項目ずつ突き合わせてから閉じる