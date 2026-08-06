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

## Risks / Trade-offs

- [JourneyMapタイルの座標系・命名規則がWeb標準(XYZ)と異なる可能性(要件定義書R-2)] → 実装着手時に実データで早期検証し、必要ならタイル変換ロジックで座標系を吸収する
- [JourneyMap/Modのバージョンアップでローカルデータフォーマットが変わりエクスポートスクリプトが壊れる(要件定義書R-3)] → バージョン固定または都度スクリプト修正で対応(意図的に許容する運用リスクとして要件定義書に明記済み)
- [フルシンクによるR2無料枠超過(要件定義書R-4)] → 実データ試算(168MB、月30回同期で操作数23,400回)により当面のリスクは低いことを確認済み。将来的な再試算が必要
- [デプロイ中の失敗による新旧タイル混在(要件定義書R-6)] → 対応策なし、意図的に許容(個人利用のため)

## Open Questions

- JourneyMapのローカルタイルディレクトリ構造とWeb標準タイル形式(ズーム/X/Y命名規則)の厳密な互換性確認(要件定義書13.2 Q-2)。エクスポートスクリプト実装着手前に実データで検証する
- biomeデータ(8.2MB)の具体的な用途・地図描画への使われ方(要件定義書13.2 Q-4)。エクスポートスクリプト実装時に確認する
