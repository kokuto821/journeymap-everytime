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

**スコープ外の明記**: 本決定はレイアウト方針であり、実装(react-leaflet導入、コンポーネント実装、CSS変数実装)はtasks.md 4・5番で別途行う。tasks.mdへのタスク追加は本変更では行わない

### JourneyMapタイル構造とWeb標準(XYZ)の互換性(issue #16、暫定調査)

> **ステータス: 暫定(2026-08-26)**。実データ(`.minecraft/journeymap/data`配下)はローカルPC上にあり本調査時点で参照できていない。以下はJourneyMapの公開ドキュメントおよびJourneyMapタイルを読み取るサードパーティツールのソースから導出した結論であり、**「実データ検証」の項のコマンドで確認するまで確定としない**。要件定義書13.2 Q-2はこの検証をもって解決とする。

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
2. **出力構造**: `tiles/<layer>/<z>/<x>,<y>.png`。x/yはJourneyMapのリージョン座標をそのまま引き継いだ符号付き値とする(`zMax`では無変換コピー、`z-1`では `x = floor(x/2)`)。非負化のためのオフセット定数を持たないことで、エクスポート側とフロント側の座標変換を一箇所に閉じ込める
3. **メタデータJSON**を併せて出力する(`zMax`、レイヤーごとのタイル座標のmin/max、タイルサイズ)。フロント側の`maxBounds`・`minZoom`/`maxZoom`をハードコードせずに済ませる

**F-001(タイル表示)への反映方針**

- **CRSは`L.CRS.Simple`系のカスタムCRS**を使う(緯度経度ベースの`L.CRS.EPSG3857`は不採用)。`L.Transformation(1, 0, 1, 0)`・`scale(z) = 2^(z - zMax)`を与え、**latlngの`lng`をワールドX、`lat`をワールドZ**に直結させる
  - これによりF-003の`convertLatLngToWorldCoordinate`は`{ x: Math.floor(lng), z: Math.floor(lat) }`という反転・オフセット無しの変換になる
  - `L.CRS.Simple`をそのまま使うとlatが上方向に増える(Minecraft +Zと逆向き)ため、Transformationで揃える
- `L.tileLayer`のURLテンプレートは`{x}`/`{y}`の単純文字列置換なので、**カンマ区切り・負値でもテンプレート`.../{z}/{x},{y}.png`がそのまま使える**。`getTileUrl`のオーバーライドは不要
- `tileSize: 512`、`noWrap: true`、`maxNativeZoom = zMax`を指定する。未探索領域はタイルが存在せず404になるため、`errorTileUrl`を設定するか背景色で透過させる(tasks.md 5.5の「対象タイルが存在しない場合に空白表示」はこの経路で満たす)

**実データ検証(ローカルPCで実施し、結果を本節に反映して確定させる)**

```bash
JM=~/.minecraft/journeymap/data/sp/<ワールド名>   # journeymap_export を使っている場合はそのパス
find "$JM" -maxdepth 2 -type d | sort              # ディメンション/レイヤーの階層を確認
ls "$JM/overworld/day" | head -20                  # ファイル名規則(<x>,<z>.png)を確認
ls "$JM/overworld/day" | wc -l                     # 260と一致するか
file "$JM/overworld/day/"*.png | head -3           # 512x512 かを確認
ls "$JM/overworld/biome" | head -5                 # biomeがPNGタイルか否か(issue #17)
```

**未検証で結論が変わりうる点**

- レイヤーごとにファイル名規則が異なる可能性(topoのみ別命名など)。上記`ls`で3レイヤーとも確認する
- タイルサイズが512以外にリサイズされている可能性(JourneyMapの設定で変更可能)。`file`コマンドの出力が実測値
- `biome`がPNGタイルではなくデータファイルの場合、issue #17の方針が変わる(本節のエクスポート方針はday/night/topoのみに適用)
- ディメンションディレクトリ名(`overworld` か `DIM0` か)はJourneyMapのバージョン依存

## Risks / Trade-offs

- [JourneyMapタイルの座標系・命名規則がWeb標準(XYZ)と異なる可能性(要件定義書R-2)] → 実装着手時に実データで早期検証し、必要ならタイル変換ロジックで座標系を吸収する
- [JourneyMap/Modのバージョンアップでローカルデータフォーマットが変わりエクスポートスクリプトが壊れる(要件定義書R-3)] → バージョン固定または都度スクリプト修正で対応(意図的に許容する運用リスクとして要件定義書に明記済み)
- [フルシンクによるR2無料枠超過(要件定義書R-4)] → 実データ試算(168MB、月30回同期で操作数23,400回)により当面のリスクは低いことを確認済み。将来的な再試算が必要
- [デプロイ中の失敗による新旧タイル混在(要件定義書R-6)] → 対応策なし、意図的に許容(個人利用のため)

## Open Questions

- JourneyMapのローカルタイルディレクトリ構造とWeb標準タイル形式(ズーム/X/Y命名規則)の厳密な互換性確認(要件定義書13.2 Q-2)。**公開情報ベースの暫定調査は完了**(Decisions「JourneyMapタイル構造とWeb標準(XYZ)の互換性」参照)。同節の「実データ検証」コマンドをローカルPCで実行し、結果を反映して確定させる。エクスポートスクリプト(tasks.md 2)着手前に実施する
- biomeデータ(8.2MB)の具体的な用途・地図描画への使われ方(要件定義書13.2 Q-4)。エクスポートスクリプト実装時に確認する
