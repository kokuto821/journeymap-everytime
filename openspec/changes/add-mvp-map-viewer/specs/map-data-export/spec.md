## Purpose

JourneyMapがローカルに生成するタイル・waypoint・biomeデータを、Web配信可能な構造に変換するローカル実行スクリプトを提供する。

## ADDED Requirements

### Requirement: JourneyMapローカルデータのエクスポート
システムは、`.minecraft/journeymap/data`配下のOverworld day/night/topo/waypoints/biomeデータを読み取り、Web配信用の構造に変換して出力しなければならない(SHALL)。

#### Scenario: エクスポートスクリプトを実行する
- **WHEN** 管理者がJourneyMapでワールドをプレイ済みの状態でエクスポートスクリプトを実行する
- **THEN** day/night/topo/waypoints/biomeのデータがWeb配信用構造に変換されてローカルに出力される

#### Scenario: 対象データが存在しない
- **WHEN** 指定されたワールドセーブのローカルデータが存在しない、またはJourneyMapの内部フォーマットが想定と異なる
- **THEN** スクリプトはエラーとなり、変換結果を出力しない

### Requirement: chunk_cacheの除外
システムは、JourneyMap内部の生チャンクキャッシュ(chunk_cache、.jmcファイル)をエクスポート対象から除外しなければならない(SHALL)。

#### Scenario: chunk_cacheディレクトリをスキップする
- **WHEN** エクスポートスクリプトがワールドデータを走査する
- **THEN** chunk_cache配下のファイルは読み取り・変換・出力のいずれの対象にもならない
