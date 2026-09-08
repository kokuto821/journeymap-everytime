## Why

現状、UIのグローバル状態はReact Context(`ThemeContext`)で管理しているが、今後F-002(レイヤー切替、#21)・F-003(座標表示、#22)で共有状態が増える見込みで、Context Providerのネストや再レンダリング範囲の管理が煩雑になる。フロントエンド実装がまだ少ない今のタイミングで、軽量な状態管理ライブラリ(jotai/zustand)の採用方針を決めておく。

## What Changes

- jotaiまたはzustandを選定し、依存関係に追加する
- 既存の`ThemeContext`/`ThemeProvider`/`useTheme`を選定したライブラリベースのstoreへ置き換える(**BREAKING**: `ThemeContext`/`ThemeProvider`のpublic API廃止。`useTheme`フックのシグネチャは維持し、内部実装のみ置き換える方針とする)
- 今後の状態(レイヤー選択・座標表示等)を置く場所の規約(ディレクトリ配置・命名規則)をREADMEに明文化する

## Capabilities

### New Capabilities
- `ui-state-management`: グローバルUI状態(テーマ選択を皮切りに、今後のレイヤー選択・座標表示等)を軽量ライブラリで管理する仕組み。store配置・命名規則を含む

### Modified Capabilities
(なし。既存の`ThemeContext`は後追いスペック化されておらず、既存specは存在しない)

## Impact

- `package.json`: jotaiまたはzustandを追加
- `src/ui/theme/`: `ThemeContext.ts`/`ThemeProvider.tsx`を置き換えまたは削除、`useTheme.ts`を選定ライブラリベースに書き換え
- `src/App.tsx`/`src/main.tsx`: `ThemeProvider`によるラップを撤去(選定ライブラリがProviderレスであれば)
- `src/ui/theme/_test_/`配下の既存テスト: 実装変更に追従(振る舞いは維持)
- `README.md`: 状態管理方針(store配置・命名規則)を追記
