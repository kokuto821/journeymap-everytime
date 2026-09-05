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
- タイル配信方式の変更・MLT(MapLibre Tiles)によるベクタータイル化は対象外。既存のラスター(XYZ PNG)方式を維持する(issue #29)
- TerraDrawの描画モード有効化・描画UI・waypoint機能との統合はv1.1以降のスコープ。本変更ではライブラリ導入と地図インスタンスへの組み込みまでとする(issue #29)

## Decisions

### フロントエンド: React + react-leaflet
- 既存Viteテンプレート(React + TypeScript)を活かし、Leafletのラッパーであるreact-leafletを導入する
- 代替案: Leaflet生API直呼び出し → Reactのコンポーネントライフサイクルとの統合が煩雑になるため不採用

### タイル配信: R2の静的ファイルをLeaflet TileLayerで直接読み込み
- R2バケットをCloudflare Pages/Workers経由、またはR2の公開URL経由でLeafletの`L.tileLayer`のURLテンプレートに直接指定する
- バックエンドを介した動的配信は行わない(要件定義書10章の「専用バックエンドは持たない」方針に合致)
- レイヤー切替はday/night/topoでURLテンプレートのパスを切り替える方式とする

### 地図操作: TerraDraw導入(issue #29)

- 地図のパン・ズームは引き続きLeaflet標準の操作(react-leaflet、上記フロントエンド決定は変更なし)に任せる
- 将来のwaypoint表示・編集(v1.1)や、地図操作を将来別のライブラリへ切り替える際のコスト低減を見据え、この段階で`terra-draw` + `terra-draw-leaflet-adapter`を導入し、Leafletの地図インスタンスに最小構成で組み込む
- **本変更のスコープ**: ライブラリのインストールとアダプターの組み込みまでとする。ポイント/ライン/ポリゴン等の描画モードの有効化、描画UI・waypoint機能の実装は行わない(v1.1以降、YAGNI)
- **検討の経緯**: 当初はLeaflet→MapLibre GL JSへの全面移行を検討したが、MapLibre GL JSはWeb Mercator(EPSG:3857)投影に固定されており、LeafletのCRS.Simple(下記「JourneyMapタイル構造とWeb標準(XYZ)の互換性」で採用している、JourneyMapの符号付き非地理座標をそのまま扱う仕組み)に相当する機能を持たないことが判明した([MapLibre Roadmap: Non-Mercator Projection](https://maplibre.org/roadmap/maplibre-gl-js/non-mercator-projection/)、[maplibre-gl-js Issue #1228](https://github.com/maplibre/maplibre-gl-js/issues/1228)でも「ゲームのワールドマップのような平面地図はLeafletのSimple CRSでは可能だが、MapBox/MapLibreでは現時点で不可能」とissueの投稿者が指摘している)。回避には座標の疑似投影・タイルURLのオフセット変換(`transformRequest`)等の自前実装が必要になり、個人開発MVPのリスク・工数に見合わないため不採用とした
- **代替案**: MapLibre GL JS + TerraDrawへの全面移行 → 上記の理由で不採用。TerraDrawはMapLibre GL JS・Leaflet双方に公式アダプター(`terra-draw-maplibre-gl-adapter`/`terra-draw-leaflet-adapter`)を持つため、この不採用判断は「地図操作の切り替えコスト低減」という目的自体を損なわない。TerraDraw導入をv1.1着手時まで見送る案 → 切り替えコスト低減を優先し、本変更で導入する方針を採用
- **未確定事項**: 実際の描画モード有効化・waypoint編集UIとの統合方式は、v1.1のissueで別途設計する

### エクスポート/デプロイスクリプト: Node.jsスクリプト + Wrangler CLI
- JourneyMapのローカルデータ(`.minecraft/journeymap/data`)読み取り・変換はNode.jsスクリプトで実装し、リポジトリ内にスクリプトとして持つ(実行はローカルPC上、CI/CDには組み込まない)
- R2へのアップロードはWrangler CLI(`wrangler r2 object put`等)をスクリプトから呼び出す形で実行する
- 代替案: 汎用クラウドSDK(aws-sdk互換のS3クライアント等)でR2に直接アップロード → 認証・設定の手間が増えるため、まずはCloudflare公式CLIであるWranglerを優先

### chunk_cache除外の実装方針
- エクスポートスクリプトの走査対象ディレクトリリストから`chunk_cache`を明示的に除外する(day/night/topo/waypoints/biomeのみを対象とするallowlist方式とし、除外漏れによる誤アップロードを防ぐ)

### UIデザイン: 配色・フォント・テーマ(issue #6、issue #5でMaterial Design 3風トークン体系に再設計)

- **テーマ方針**: シンプルテーマ・レトロゲームテーマの2層のみ実装する。アクセシブルテーマは要件定義書9章「アクセシビリティ 特に配慮しない(個人利用のため対象外)」の既存方針により対象外とする
- **世界観**: 2テーマで明確に差別化する。シンプルテーマは白基調のクリーンなライトUI、レトロゲームテーマは青空を思わせる明るい配色と太い黒枠・ハードシャドウで8-bit/16-bit世代のアーケードゲーム画面を想起させるUI
- **再設計の経緯**: issue #5(S-01レイアウト検討)作業中、参考デザインシステム(Material Design 3風のセマンティックトークン命名)をベースに配色を見直した。トークン量は同参考資料の全45トークンではなく、S-01で実際に使う分のみに絞る(YAGNI、既存の「色変数は最小限に絞る」方針を踏襲)

- **配色トークン(7トークン、`primary`/`on-primary`がアクセント役)**

  シンプルテーマ:
  | トークン | 値 | 用途 |
  |---|---|---|
  | `background` | `#fdf7ff` | 画面地の背景 |
  | `surface` | `#fdf7ff` | パネル/ヘッダー/ボタン地(80%不透明度+backdrop-blurで地図に重ねる想定) |
  | `on-surface` | `#1d1b20` | 主要テキスト |
  | `on-surface-variant` | `#494551` | 補助テキスト・非選択アイコン |
  | `outline` | `#7a7582` | 境界線 |
  | `primary` | `#4f378a` | アクセント(選択中レイヤー・主要CTA) |
  | `on-primary` | `#ffffff` | primary地の上のテキスト/アイコン |

  レトロゲームテーマ(既存hex値を維持しつつ同一トークン構造に再配置):
  | トークン | 値 | 用途 |
  |---|---|---|
  | `background` | `#3F6CFF` | ビビッドロイヤルブルー |
  | `surface` | `#FFFDF5` | オフホワイトのパネル/ヘッダー/ボタン地(空と雲のような対比を演出) |
  | `on-surface` | `#1A1A1E` | 主要テキスト・境界線・影色 |
  | `on-surface-variant` | `#494551` | 補助テキスト(シンプルテーマと共通値) |
  | `outline` | `#1A1A1E` | 境界線(黒) |
  | `primary` | `#FFD23F` | ビビッドイエロー(選択中レイヤー・主要CTA) |
  | `on-primary` | `#1A1A1E` | primary(黄)地の上は黒文字(白文字よりコントラスト確保) |

- **影・境界線(テーマ差別化、issue #6から継続)**
  - シンプルテーマ: 影無し(フラット)。境界線1px、色は`outline`
  - レトロゲームテーマ: 境界線3px、色は`outline`(黒)。影は`box-shadow: 4px 4px 0 var(--on-surface)`(ぼかし無しハードシャドウ)でドット絵・アーケード筐体らしい押し込み感を演出。ボタン押下時は影が消え要素が右下2px移動し、物理的な押し込みを表現する

- **フォント方針**
  - 両テーマ共通の本文: `system-ui, "Noto Sans JP", sans-serif`(可読性優先)
  - レトロゲームテーマの見出し・ボタンラベル: `DotGothic16`(Google Fonts、日本語対応ドットフォント)
  - 座標数値表示(両テーマ共通): `"Courier Prime", ui-monospace, monospace`(Google Fonts、新規)。等幅にして桁数変化時の文字幅ジッターを防ぐ

- **シェイプ・スペーシング(新規)**
  - 角丸: シンプルテーマ12px(0.75rem)、レトロゲームテーマ0px(角ばった形状)。ただしピル型のボタンバー等、丸形状が前提のコンポーネントは両テーマとも維持する例外を許容する
  - スペーシング基準: 8pxグリッド。画面端マージン16px、パネル内パディング12px、要素間隔8px、大きい余白24px

- **スコープ外の明記**: 本決定はデザイン方針であり、Tailwind導入・CSS変数実装・Material Symbols Outlined/Courier PrimeのGoogle Fonts追加設定・各コンポーネントへの適用は別issueで対応する(tasks.mdへのタスク追加は本変更では行わない)

### アプリケーション内部レイヤー構成: 簡略版オニオンアーキテクチャ(issue #7)

- **採用レイヤー**: ドメイン層・インフラ層・UI層の3層。フル4層(ドメイン/アプリケーション/インフラ/プレゼンテーション厳密分離、機能ごとにUseCaseクラス)は採用しない。「アプリケーション層」は独立ディレクトリを設けず、UI層内の薄いカスタムhooksに同居させる
- **理由**: F-001〜F-003は単一画面・読み取り専用で複雑な業務ルールを持たず、UseCaseクラスやDIコンテナを導入しても解決すべき複雑さが存在しない。一方でUIにR2/Leaflet依存を直書きする責務混在は、インフラ層への集約とドメインの型(`LayerType`, `WorldCoordinate`)共有のみで防止できる
- **依存方向**: `domain`は何もimportしない → `infrastructure`は`domain`をimportしてよい → `ui`は両方をimportしてよい。逆方向は禁止(MVPではESLintでの強制はせず、将来の拡張ポイントとして明記のみ)
- **代替案**: UseCase/Interactorクラスの機能ごと作成、インターフェース+DIコンテナのリポジトリパターン、独立した「アプリケーション層」ディレクトリ → いずれも不採用(ボイラープレート増・YAGNI違反に対し実利が薄いため)。biomeデータのドメインモデル化も不採用(用途未確定、Open Questions参照)。Node.jsスクリプト(F-004/F-005)への同一4層+DIのフル適用も不採用(1回限りのCLIで複雑さに見合わない)

**F-001〜F-005 レイヤー対応表**

| 機能 | 実行環境 | ドメイン層 | インフラ層 | UI層/CLIエントリ |
|---|---|---|---|---|
| F-001 タイル地図表示 | フロント | `LayerType`(day/night/topo)、`Dimension`(overworld) | `r2TileUrlProvider`(LayerType→R2タイルURLテンプレート) | `MapView.tsx`(TerraDraw+`terra-draw-leaflet-adapter`の組み込みを含む)、`useTileLayerUrl` |
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

### 画面レイアウト: S-01地図ビュー(issue #5)

TopAppBar(画面上部)とBottomNavBar(画面下部)の2要素で構成する。両者は画面の上下端に分離配置されるため、座標表示パネルとレイヤー切替UIの重なりは構造的に発生しない(issue #5の未確定事項の解決)。

- **地図**: フルブリードで画面全体に表示。ヘッダー/ナビ等は無し(v1は単一画面のため不要)。ズームボタン・現在地FABは設けない。ピンチ/ホイール/ダブルタップ/ダブルクリック操作のみでズームする
- **TopAppBar(座標表示・コピー、F-003)**: 画面上部中央、画面端から16pxのインセット、高さ48px。中央寄せで座標を表示する。地図クリック前は「地図をタップして座標表示」のプレースホルダ文言(本文フォント)、クリック後は等幅フォントで「X, Y, Z」形式の座標値に切り替わり、次のクリックで内容を置き換える(明示的な閉じるボタンは設けない、YAGNI)。座標表示の直後にコピーアイコンボタンを配置し、座標が無い間はdisabledにする
- **BottomNavBar(レイヤー切替、F-002)**: 画面下部中央、画面端から24pxのインセット、ピル形状。昼/夜/地形の3アイコンボタンを8px間隔で横並びに配置し、モバイルの親指到達域に置く
  - 選択中: アイコン背景がアクセント色で塗られ、110%に拡大表示。レトロゲームテーマはさらに影が一段大きくポップする
  - 非選択: 補助テキスト色のアイコン、背景無し
- **スコープ外の要素**: 設定ボタン・コンパスボタン・現在地FAB・waypoint一覧パネル・waypoint用ナビアイコンは、要件(F-001〜F-003)に無くwaypointのUI表示はv1.1スコープ外(proposal.md参照)のため、S-01には含めない
- **レスポンシブ**: モバイル/PC問わず同一のTopAppBar+BottomNavBar構造を維持する(単一レイアウト、ブレークポイント分岐無し)

**ASCIIワイヤーフレーム**:
```
┌───────────────────────────────┐
│      ┌───────────────────┐    │
│      │ X:.. Y:.. Z:.. [⧉]│    │ ← TopAppBar(常時表示、中央寄せ)
│      └───────────────────┘    │
│                                │
│           (地図)                │
│        フルブリード表示          │
│     ピンチ/ドラッグでズーム/パン   │
│                                │
│                                │
│    ┌──────────────────────┐   │
│    │  ☀    🌙    ▲        │   │ ← BottomNavBar(昼/夜/地形、ピル形状)
│    └──────────────────────┘   │
└───────────────────────────────┘
```

**スコープ外の明記**: 本決定はレイアウト方針であり、実装(react-leaflet・TerraDraw導入、コンポーネント実装、CSS変数実装)はtasks.md 4・5番で別途行う。tasks.mdへのタスク追加は本変更では行わない

### JourneyMapタイル構造とWeb標準(XYZ)の互換性(issue #16、実データ検証済み)

> **ステータス: 実データ検証済み(2026-08-28)**。`journeymap_export_kokuto_world_2026-08-06_22.14.48`(JourneyMapのWeb Map Export機能による出力、約1.1GB)をローカルPC上で直接調査した。以下の「調査結論(暫定)」表と「ディレクトリ・命名規則」は公開情報ベースの暫定調査時点の内容のまま残すが、座標系・命名規則・タイルサイズに関する結論は実データと一致することを確認済み。差分・新たな判明事項は本節末尾の「実データ検証結果(2026-08-28)」を参照。要件定義書13.2 Q-2はこの検証をもって解決とする。

**調査結論(暫定)**

| 観点 | JourneyMap | Web標準XYZ | 互換性 |
|---|---|---|---|
| ディレクトリ階層 | `data/{sp\|mp}/<world>/<dimension>/<mapType>/` の直下にタイルを平置き | `{z}/{x}/{y}.png` | **非互換**(ズーム階層が無い) |
| ファイル名 | `<regionX>,<regionZ>.png`(符号付き整数、カンマ区切り) | `{y}.png`(非負整数) | **要変換**(負値・カンマ) |
| タイルサイズ | 512×512px、1px = 1ブロック(= Minecraftの1リージョン = 512×512ブロック) | 慣例256px(任意) | 互換(`tileSize: 512`で吸収) |
| ズームレベル | **存在しない**。ネイティブ解像度の1層のみを保持し、拡大縮小は描画時に行う | z=0を頂点とするピラミッド | **非互換**(生成が必要) |
| Y軸の向き | Minecraft +Z = 画面下方向(北が上) | +y = 画面下方向 | **互換**(反転不要) |
| 原点 | ワールド座標(0,0)。負のタイル座標が存在する | 世界の左上端。非負のみ | 要オフセット or 負値許容 |

**ディレクトリ・命名規則**

```
.minecraft/journeymap/data/sp/<ワールド名>/
├── overworld/            # ディメンション(旧バージョンは DIM0 / DIM-1 / DIM1)
│   ├── day/   -4,3.png -4,4.png ...   # <regionX>,<regionZ>.png
│   ├── night/ (同じ命名)
│   ├── topo/  (同じ命名)
│   ├── biome/ (同じ命名と推定 → issue #17で確認)
│   └── chunk_cache/  (.jmc、エクスポート対象外)
├── the_nether/<スライス0〜15>/...      # v1スコープ外
└── the_end/day/...                    # v1スコープ外
```

- 1ファイル = 1タイル = **Minecraftの1リージョン(512×512ブロック)**。要件定義書13.3の「day/night/topoが揃って260ファイル」は「探索済みリージョン260個 × 3レイヤー」と解釈でき、ズームピラミッドが存在しない(存在すればレベルごとにファイル数が変わる)ことと整合する
- ブロック座標との対応: `regionX = floor(worldX / 512)`、`regionZ = floor(worldZ / 512)`。タイル内ピクセル座標は `(worldX mod 512, worldZ mod 512)`(左上原点)
- **要件定義書R-2で最も懸念していた「1ファイルが大きな領域画像で再切り出しが必要」ケースには該当しない**見込み。1ファイル=1タイルであり、F-004は実質「ピラミッド生成 + リネーム」で済む

**F-004(エクスポート)への反映方針**

1. **ズームピラミッドを生成する**。ネイティブ(1px=1ブロック)を最大ズーム`zMax`とし、2×2タイルを1枚に縮小する処理を再帰的に適用してズームアウト側を作る。260タイルを縮小なしで全面表示するとタイル読み込みが260枚(=約78MB)になるため、Leafletの`minNativeZoom`によるブラウザ側縮小では要件定義書のモバイル閲覧要件を満たせない
   - **最小ズームレベルの停止条件(issue#18実装時に判明、2026-08-29追記)**: 「全リージョンが単一タイル(0,0)に収まるまで」という素朴な条件は誤り。`floor(x/2)`の不動点は正の座標では`0`、負の座標では`-1`に分かれる(例: `x=-4→-2→-1→-1…`、`x=1→0→0…`)ため、JourneyMapの実データのようにスポーン地点(0,0)を挟んで正負両方に座標が分布する場合、この条件は到達不能(無限再帰)になる。正しくは、**x座標・y座標それぞれのユニーク値集合が、そのズームレベルでこれ以上`floor(x/2)`を適用しても変化しなくなった時点で再帰を停止する(不動点検出)**。正負をまたぐ場合、最小ズームで最大2×2=4タイル程度が残る形になり、必ずしも単一タイルに収束するとは限らない。フロント側の`minZoom`はこの不動点に達したレベルに設定する(下記3のメタデータJSONで動的に受け渡す)
   - **4隅とも未探索の場合(issue#18実装時に追記)**: 2×2合成対象の4リージョンタイルが1枚も存在しない場合、そのズームレベル・座標のタイル自体を生成しない(出力をスキップする)。「未探索領域はタイルが存在せず404になる」という既存方針(F-001節)と整合させる
   - **部分的に欠けた隣接タイルの合成方法(issue#18実装時に追記)**: 2×2合成対象のうち1〜3枚のみ存在する場合、存在しない部分は透過(アルファチャンネル0)として合成する。F-001節の「未探索領域は背景色で透過させる」方針をズームピラミッド生成時の合成処理にも適用する
2. **出力構造**: `tiles/<layer>/<z>/<x>,<y>.png`。x/yはJourneyMapのリージョン座標をそのまま引き継いだ符号付き値とする(`zMax`では無変換コピー、`z-1`では `x = floor(x/2)`)。非負化のためのオフセット定数を持たないことで、エクスポート側とフロント側の座標変換を一箇所に閉じ込める
3. **メタデータJSON**を併せて出力する(`zMax`、レイヤーごとのタイル座標のmin/max、タイルサイズ)。フロント側の`maxBounds`・`minZoom`/`maxZoom`をハードコードせずに済ませる
   - **`minZoom`はレイヤー横断で単一の値とする(issue#18実装時に追記、2026-08-29)**: 上記1の不動点検出はレイヤー(day/night/topo/biome)ごとに独立して行われるため、レイヤーごとに算出される`minZoom`が異なりうる。しかしLeafletの地図インスタンスは単一のCRS/zoom範囲しか持てず、レイヤー切替はTileLayerのURLテンプレート切替のみで行う(F-002節)ため、`minZoom`は全レイヤー共通の1つの値でなければならない。**各レイヤーで個別に算出した`minZoom`のうち最小値(最もズームアウトを要するレイヤーに合わせる)をメタデータJSONの`minZoom`として採用する**。他レイヤーがそのズームレベルでタイルを持たない場合は、F-001節の「未探索領域は透過/404」という既存方針でカバーされる

**F-001(タイル表示)への反映方針**

- **CRSは`L.CRS.Simple`系のカスタムCRS**を使う(緯度経度ベースの`L.CRS.EPSG3857`は不採用)。`L.Transformation(1, 0, 1, 0)`・`scale(z) = 2^(z - zMax)`を与え、**latlngの`lng`をワールドX、`lat`をワールドZ**に直結させる
  - これによりF-003の`convertLatLngToWorldCoordinate`は`{ x: Math.floor(lng), z: Math.floor(lat) }`という反転・オフセット無しの変換になる
  - `L.CRS.Simple`をそのまま使うとlatが上方向に増える(Minecraft +Zと逆向き)ため、Transformationで揃える
- `L.tileLayer`のURLテンプレートは`{x}`/`{y}`の単純文字列置換なので、**カンマ区切り・負値でもテンプレート`.../{z}/{x},{y}.png`がそのまま使える**。`getTileUrl`のオーバーライドは不要
- `tileSize: 512`、`noWrap: true`、`maxNativeZoom = zMax`を指定する。未探索領域はタイルが存在せず404になるため、`errorTileUrl`を設定するか背景色で透過させる(tasks.md 5.5の「対象タイルが存在しない場合に空白表示」はこの経路で満たす)

**実データ検証結果(2026-08-28)**

実際のエクスポートフォルダ構造:

```
journeymap_export_kokuto_world_2026-08-06_22.14.48/
├── overworld/
│   ├── day/      246枚 <regionX>,<regionZ>.png(512×512, 8bit RGBA) + lod1〜lod7.jmd/jmm  78MB
│   ├── night/    同上構成                                                              61MB
│   ├── topo/     同上構成                                                              22MB
│   ├── biome/    同上構成                                                             8.2MB
│   ├── -4〜23/   28個の数値ディレクトリ(詳細は下記「新たに判明した点」)          数MB程度
│   └── chunk_cache/  246個の .jmc(独自バイナリ、内部チャンクキャッシュ)             945MB
└── waypoints/
    └── WaypointData.dat   NBT形式(GZip無し生NBT)、1.3KB
```

- ファイル名規則(`<regionX>,<regionZ>.png`)・タイルサイズ(512×512px)・座標系(符号付き整数、Y軸の向き)は**4レイヤー(day/night/topo/biome)すべてで暫定調査の結論と一致**
- ファイル数は**246**(要件定義書13.3の記憶ベース試算「260」から実測で修正。4レイヤーとも246枚で揃っており、レイヤー間の枚数不一致は無い)
- サイズ試算は**ほぼ的中**。day+night+topo+biome合計 = 78+61+22+8.2 ≒ **169MB**(design.md記載の「約168MB」試算と一致)。ただし**エクスポート対象外のchunk_cacheが945MBと全体(1.1GB)の大半を占める**ことを確認(エクスポート対象外の方針は妥当)
- `biome`は**PNGタイル**であり、データファイルではない(issue #17のQ-4は「PNGタイルである」ことまでは解決。用途・描画への使われ方は引き続き未確認)
- ディメンションディレクトリ名は`overworld`(想定通り)
- `WaypointData.dat`は**NBT形式**(`file`コマンドではPCXと誤判定されるため注意)。`waypoints`→`groups`→`journeymap_default`にicon/opacity/resourceLocation等のフィールドを持つ

**新たに判明した点(公開情報ベースの暫定調査時点では未把握)**

- day/night/topo/biomeの各ディレクトリに、246枚のネイティブタイルpngとは別に**`lod1.jmd`/`lod1.jmm`〜`lod7.jmd`/`lod7.jmm`のペアファイルが存在**する。`.jmd`はzlib圧縮データ、`.jmm`は独自マジックバイト(`JMLA`)を持つバイナリ。中身は未解析
- `overworld`直下に**`-4`〜`23`の28個の数値ディレクトリ**が存在し、各々に少数(1〜7枚)のpng(命名規則は同じ`<x>,<z>.png`)が入っている。うち`4`ディレクトリのみ`lod2.jmd/jmm`・`lod3.jmd/jmm`も混入
- 上記2点から、**JourneyMapは内部的にLOD(Level of Detail)キャッシュ機構を持つ**と推測される(ネイティブ解像度の246枚とは別に、ズームアウト表示用と思われる合成データを保持)。ただし各lod*ディレクトリ・数値ディレクトリの合計サイズはネイティブタイルに比べ小さく(biome除き数MB程度)、**エクスポート(F-004)で使う実体は従来通りday/night/topo/biomeのネイティブ246枚のままで問題ない**と判断する。lod*.jmd/jmm・数値ディレクトリはエクスポート対象外として扱う(chunk_cacheと同様、JourneyMap内部専用のキャッシュと推定されるため)

**未解明のまま残る点**

- lod*.jmd/jmmファイルおよび数値ディレクトリ(-4〜23)の内部フォーマット・厳密な用途(エクスポート対象外の判断自体は上記の通り確定させるが、フォーマットの解析自体は行っていない)
- biomeデータの地図描画への具体的な使われ方(要件定義書13.2 Q-4、引き続き未解決)

## Risks / Trade-offs

- [JourneyMapタイルの座標系・命名規則がWeb標準(XYZ)と異なる可能性(要件定義書R-2)] → **実データ検証済み(2026-08-28)**。座標系・命名規則は暫定調査の結論通りで、想定していた変換ロジックで対応可能
- [JourneyMap/Modのバージョンアップでローカルデータフォーマットが変わりエクスポートスクリプトが壊れる(要件定義書R-3)] → バージョン固定または都度スクリプト修正で対応(意図的に許容する運用リスクとして要件定義書に明記済み)
- [フルシンクによるR2無料枠超過(要件定義書R-4)] → 実データ試算(168MB、月30回同期で操作数23,400回)により当面のリスクは低いことを確認済み。将来的な再試算が必要
- [デプロイ中の失敗による新旧タイル混在(要件定義書R-6)] → 対応策なし、意図的に許容(個人利用のため)

## Open Questions

- ~~JourneyMapのローカルタイルディレクトリ構造とWeb標準タイル形式(ズーム/X/Y命名規則)の厳密な互換性確認(要件定義書13.2 Q-2)~~ → **解決済み(2026-08-28)**。実データ検証によりDecisions「JourneyMapタイル構造とWeb標準(XYZ)の互換性」の結論(座標系・命名規則・タイルサイズ)を確認済み
- biomeデータ(8.2MB)がPNGタイルであることは実データ検証で確認済み(2026-08-28)だが、地図描画への具体的な使われ方(要件定義書13.2 Q-4)は引き続き未解決。エクスポートスクリプト実装時に確認する
- lod*.jmd/jmm・数値ディレクトリ(-4〜23)として実データで新たに発見したJourneyMap内部LODキャッシュ機構の内部フォーマット・用途(上記Decisions節「実データ検証結果」参照)。エクスポート対象外という判断自体は確定させたが、フォーマット解析は行っていない
