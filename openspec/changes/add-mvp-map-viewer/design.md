## Context

現リポジトリはVite react-tsテンプレート初期化直後で、地図表示機能は未実装。要件定義書(10章)ではLeaflet採用が前提、バックエンド・DBは持たずCloudflare Pages + R2で静的配信する構成が確定している。エクスポート/デプロイはCI/CDを使わずローカルPC上のスクリプトで手動実行する方針(要件定義書1.4・9章・11章)。詳細な動機はproposal.mdのWhyを参照。

## Goals / Non-Goals

**Goals:**
- map-viewer・map-data-export・map-data-deployの3capabilityをMVPとして一貫した構成で実装できる技術方針を示す
- R2上のタイル構造とフロントエンドの読み込み方式を齟齬なくつなぐ

**Non-Goals:**
- waypointのUI表示(v1.1)・地図編集(v2)の設計は対象外
- JourneyMapタイルの座標系・命名規則がLeaflet標準と厳密に一致するかの検証手順の詳細化(要件定義書13.2 Q-2、実装着手時に別途検証)
- 認証機構の設計(要件定義書の方針により導入しない)

## Decisions

### フロントエンド: React + react-leaflet
- 既存Viteテンプレート(React + TypeScript)を活かし、Leafletのラッパーであるreact-leafletを導入する
- 代替案: Leaflet生API直呼び出し → Reactのコンポーネントライフサイクルとの統合が煩雑になるため不採用

### タイル配信: R2の静的ファイルをLeaflet TileLayerで直接読み込み
- R2バケットをCloudflare Pages/Workers経由、またはR2の公開URL経由でLeafletの`L.tileLayer`のURLテンプレートに直接指定する
- バックエンドを介した動的配信は行わない(要件定義書10章の「専用バックエンドは持たない」方針に合致)
- レイヤー切替はday/night/topoでURLテンプレートのパスを切り替える方式とする

### エクスポート/デプロイスクリプト: Node.jsスクリプト + Wrangler CLI
- JourneyMapのローカルデータ(`.minecraft/journeymap/data`)読み取り・変換はNode.jsスクリプトで実装し、リポジトリ内にスクリプトとして持つ(実行はローカルPC上、CI/CDには組み込まない)
- R2へのアップロードはWrangler CLI(`wrangler r2 object put`等)をスクリプトから呼び出す形で実行する
- 代替案: 汎用クラウドSDK(aws-sdk互換のS3クライアント等)でR2に直接アップロード → 認証・設定の手間が増えるため、まずはCloudflare公式CLIであるWranglerを優先

### chunk_cache除外の実装方針
- エクスポートスクリプトの走査対象ディレクトリリストから`chunk_cache`を明示的に除外する(day/night/topo/waypoints/biomeのみを対象とするallowlist方式とし、除外漏れによる誤アップロードを防ぐ)

### UIデザイン: 配色・フォント・テーマ(issue #6)

- **テーマ方針**: シンプルテーマ・レトロゲームテーマの2層のみ実装する。アクセシブルテーマは要件定義書9章「アクセシビリティ 特に配慮しない(個人利用のため対象外)」の既存方針により対象外とする。CSS変数はUI哲学.mdの方針(「色」＋「影・光」のみテーマ管理、サイズ・余白・角丸は含めない)に従い設計する
- **世界観**: 2テーマで明確に差別化する。シンプルテーマは白基調のクリーンなライトUI、レトロゲームテーマは青空を思わせる明るい配色と太い黒枠・ハードシャドウで8-bit/16-bit世代のアーケードゲーム画面を想起させるUI

- **配色パレット(70/25/5ルール準拠、shared-rules/ui-design/styling-rule/color.md基準)**

  シンプルテーマ(白基調・アクセシビリティ対応・コントラスト比4.5:1以上を保証):
  - base 70%: `#FFFFFF`(白背景、地図タイルの視認性を最大化)
  - main 25%: `#F0F0EE`(パネル/ヘッダー/ボタン背景)、境界線 `#D8D8D4`
  - accent 5%: `#16A34A`(グリーン、選択中レイヤー・主要CTA。白背景上でも4.5:1を確保できる濃さ)
  - テキスト: `#1A1A1E`(base比コントラスト比 約18:1)
  - セカンダリテキスト: `#5A5A63`(base比コントラスト比 約7:1)

  レトロゲームテーマ(明るいアーケード風・青基調・視覚優先・アクセシビリティ非保証):
  - base 70%: `#3F6CFF`(ビビッドロイヤルブルー)
  - main 25%: `#FFFDF5`(オフホワイト、パネル/ヘッダー/ボタン地。空と雲のような対比を演出)
  - accent 5%: `#FFD23F`(ビビッドイエロー、選択中レイヤー・主要CTA)
  - 境界線・影: 太めの黒枠(`#1A1A1E`、2〜4px)とオフセット付きハードシャドウ(`box-shadow: 4px 4px 0 #1A1A1E`、ぼかし無し)でドット絵・アーケード筐体らしい押し込み感を演出し、シンプルテーマ(細い薄グレー境界線・影なし)との視覚差を明確にする

- **フォント方針**
  - シンプルテーマ: 見出し・本文とも`system-ui, "Noto Sans JP", sans-serif`で統一(クリーンさ優先、ゲーム風フォントは使わない)
  - レトロゲームテーマ: 見出し・ボタンラベル等の主要UI要素に`DotGothic16`(Google Fonts、日本語対応ドットフォント)を使用、本文は`system-ui, "Noto Sans JP", sans-serif`のまま可読性を優先
  - サイズ階層はUI哲学.mdの方針(サイズ・余白はテーマに含めない)に従い、テーマ変数とは別に定義する

- **スコープ外の明記**: 本決定はデザイン方針であり、Tailwind導入・CSS変数実装・各コンポーネントへの適用は別issueで対応する(tasks.mdへのタスク追加は本変更では行わない)

### アプリケーション内部レイヤー構成: 簡略版オニオンアーキテクチャ(issue #7)

- **採用レイヤー**: ドメイン層・インフラ層・UI層の3層。フル4層(ドメイン/アプリケーション/インフラ/プレゼンテーション厳密分離、機能ごとにUseCaseクラス)は採用しない。「アプリケーション層」は独立ディレクトリを設けず、UI層内の薄いカスタムhooksに同居させる
- **理由**: F-001〜F-003は単一画面・読み取り専用で複雑な業務ルールを持たず、UseCaseクラスやDIコンテナを導入しても解決すべき複雑さが存在しない。一方でUIにR2/Leaflet依存を直書きする責務混在は、インフラ層への集約とドメインの型(`LayerType`, `WorldCoordinate`)共有のみで防止できる
- **依存方向**: `domain`は何もimportしない → `infrastructure`は`domain`をimportしてよい → `ui`は両方をimportしてよい。逆方向は禁止(MVPではESLintでの強制はせず、将来の拡張ポイントとして明記のみ)
- **代替案**: UseCase/Interactorクラスの機能ごと作成、インターフェース+DIコンテナのリポジトリパターン、独立した「アプリケーション層」ディレクトリ → いずれも不採用(ボイラープレート増・YAGNI違反に対し実利が薄いため)。biomeデータのドメインモデル化も不採用(用途未確定、Open Questions参照)。Node.jsスクリプト(F-004/F-005)への同一4層+DIのフル適用も不採用(1回限りのCLIで複雑さに見合わない)

**F-001〜F-005 レイヤー対応表**

| 機能 | 実行環境 | ドメイン層 | インフラ層 | UI層/CLIエントリ |
|---|---|---|---|---|
| F-001 タイル地図表示 | フロント | `LayerType`(day/night/topo)、`Dimension`(overworld) | `r2TileUrlProvider`(LayerType→R2タイルURLテンプレート) | `MapView.tsx`、`useTileLayerUrl` |
| F-002 レイヤー切替 | フロント | `LayerType`妥当性判定 | (F-001の`r2TileUrlProvider`を再利用) | `LayerSwitcher.tsx`、`useTileLayerUrl` |
| F-003 座標表示・コピー | フロント | `WorldCoordinate`(値オブジェクト)、`convertLatLngToWorldCoordinate` | `clipboardWriter`(`navigator.clipboard`ラッパー) | `CoordinatePanel.tsx`、`useMapCoordinate` |
| F-004 エクスポートスクリプト | Node.js CLI | `exportTargetPolicy`(allowlist方式、chunk_cache除外)、`Tile`/`Waypoint`形状定義 | `journeyMapFileReader`、`exportFileWriter` | `scripts/export/index.ts` |
| F-005 デプロイスクリプト | Node.js CLI | (F-004の型を再利用) | `wranglerR2Uploader`(child_process経由でWrangler呼び出し) | `scripts/deploy/index.ts` |

**ドメインモデル**: 値オブジェクト = `WorldCoordinate`、`TileCoordinate`(zoom/x/y)、`LayerType`(day/night/topo)、`Dimension`(overworld固定)。エンティティ = `Tile`(Dimension+LayerType+TileCoordinateが識別子)、`Waypoint`(名前・座標・アイコン・色、v1.1向け先行定義)。biomeデータは用途未確定のため未分類のままopaqueに扱う

**データ駆動設計**: ドメイン層はfetch/URL文字列/R2バケット名を一切持たない。インフラ層`r2TileUrlProvider`が`LayerType`とR2ベースURL(Vite環境変数経由)からLeaflet `TileLayer`用URLテンプレートを組み立てる一点に、タイルURL構築ロジックを集約する。v1.1以降のwaypoint/biome参照も同パターン(`waypointRepository`等)を踏襲する。エクスポート側は`exportTargetPolicy`(宣言的allowlist)に従い`journeyMapFileReader`が走査する

**将来のディレクトリ構成**

```
src/
├── domain/
│   ├── layer/LayerType.ts
│   ├── coordinate/WorldCoordinate.ts
│   ├── coordinate/TileCoordinate.ts
│   ├── coordinate/convertLatLngToWorldCoordinate.ts
│   ├── tile/Tile.ts
│   ├── waypoint/Waypoint.ts        # v1.1向け先行定義
│   └── world/Dimension.ts
├── infrastructure/
│   ├── tile/r2TileUrlProvider.ts
│   ├── clipboard/clipboardWriter.ts
│   └── config/env.ts
├── ui/
│   └── map-view/
│       ├── MapView.tsx
│       ├── LayerSwitcher.tsx
│       ├── CoordinatePanel.tsx
│       ├── useTileLayerUrl.ts
│       └── useMapCoordinate.ts
├── App.tsx
└── main.tsx

scripts/                             # Viteビルド対象外
├── export/
│   ├── domain/exportTargetPolicy.ts
│   ├── infrastructure/journeyMapFileReader.ts
│   ├── infrastructure/exportFileWriter.ts
│   └── index.ts
└── deploy/
    ├── infrastructure/wranglerR2Uploader.ts
    └── index.ts
```

着手順の目安: `src/domain/` → `infrastructure/` → `ui/`(依存方向に沿う)。`scripts/`はF-004事前検証(tasks.md 1.1/1.2)完了後

**スコープ外の明記**: 本決定はレイヤー構成の設計方針であり、実装は各タスク着手時にこの構成に従う。tasks.mdへの個別タスク追加は本変更では行わない

## Risks / Trade-offs

- [JourneyMapタイルの座標系・命名規則がWeb標準(XYZ)と異なる可能性(要件定義書R-2)] → 実装着手時に実データで早期検証し、必要ならタイル変換ロジックで座標系を吸収する
- [JourneyMap/Modのバージョンアップでローカルデータフォーマットが変わりエクスポートスクリプトが壊れる(要件定義書R-3)] → バージョン固定または都度スクリプト修正で対応(意図的に許容する運用リスクとして要件定義書に明記済み)
- [フルシンクによるR2無料枠超過(要件定義書R-4)] → 実データ試算(168MB、月30回同期で操作数23,400回)により当面のリスクは低いことを確認済み。将来的な再試算が必要
- [デプロイ中の失敗による新旧タイル混在(要件定義書R-6)] → 対応策なし、意図的に許容(個人利用のため)

## Open Questions

- JourneyMapのローカルタイルディレクトリ構造とWeb標準タイル形式(ズーム/X/Y命名規則)の厳密な互換性確認(要件定義書13.2 Q-2)。エクスポートスクリプト実装着手前に実データで検証する
- biomeデータ(8.2MB)の具体的な用途・地図描画への使われ方(要件定義書13.2 Q-4)。エクスポートスクリプト実装時に確認する
