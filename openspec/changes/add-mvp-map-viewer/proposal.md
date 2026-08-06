## Why

現状、JourneyMapの地図はマインクラフト起動中かつlocalhost:8080が稼働している場合しか閲覧できず、外出中やマインクラフト未起動時に地図を見ながら次の行動計画を立てられない。要件定義書(`要件定義書_マイクラMAPエディター_v0.3.md`)で確定したMVP(v1.0)スコープを実装し、スマホ/PCのブラウザからいつでも地図タイルを閲覧できる状態にする。

## What Changes

- Overworldの地図タイル(昼/夜/地形の3レイヤー)をLeafletでパン・ズーム表示するWeb地図ビューア(単一画面 S-01)を新規構築する
- レイヤー切替UI(昼/夜/地形)を追加する
- 地図クリック地点の座標表示・コピー機能を追加する
- JourneyMapローカルデータ(`.minecraft/journeymap/data`)からday/night/topo/biome/waypointsタイル一式(約168MB)を読み取り、Web配信用構造に変換するエクスポートスクリプト(ローカル実行)を新規構築する。chunk_cache(945MB)は対象外とする
- エクスポート済みデータをCloudflare R2へフルシンク(全量上書き)でアップロードするデプロイスクリプト(ローカル実行、Wrangler CLI等)を新規構築する
- 認証機構は設けず、推測困難なURLのみで非公開運用する

対象外(本変更に含めない): waypointのマーカー表示・検索・ジャンプ(v1.1)、地図編集機能(v2)、Cave/Nether/Endレイヤー、距離測定機能、CI/CDによる自動デプロイ

## Capabilities

### New Capabilities
- `map-viewer`: ブラウザ上でOverworldの地図タイルをパン・ズーム表示し、昼/夜/地形レイヤー切替と座標表示・コピーを提供する(F-001, F-002, F-003)
- `map-data-export`: JourneyMapローカルデータからタイル画像・waypoint・biomeデータを読み取りWeb配信用構造に変換するローカルスクリプト(F-004)
- `map-data-deploy`: エクスポート済みデータをCloudflare R2へフルシンクでアップロードするローカルスクリプト(F-005)

### Modified Capabilities
(既存specなし、該当なし)

## Impact

- 新規: フロントエンド(Leaflet/react-leaflet導入、地図表示コンポーネント一式)
- 新規: ローカルPC上で実行するNode.js等のエクスポート/デプロイスクリプト(リポジトリ外の`.minecraft/journeymap/data`を読み取る)
- 新規: Cloudflare Pages(フロント配信)・Cloudflare R2(タイルデータ約168MB格納)の設定
- 影響なし: バックエンド・DBは持たない方針のため追加インフラなし
- 依存: Wrangler CLI、Cloudflareアカウント認証情報(ローカルPC側で管理)
