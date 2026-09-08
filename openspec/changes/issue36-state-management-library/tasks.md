## 1. セットアップ

- [x] 1.1 zustandを依存関係に追加する(委譲先: coding)

## 2. storeの実装(テスト駆動)

- [x] 2.1 `src/ui/state/useThemeStore.ts`を作成する。themeNameの保持・setThemeName・data-theme属性への反映(subscribe)を実装し、design.mdの配置・命名規則に従う(委譲先: tdd)

## 3. 既存実装の置き換え(テスト駆動)

- [x] 3.1 `useTheme.ts`を`useThemeStore`への薄いラッパーに書き換える。呼び出しシグネチャ`{ themeName, setThemeName }`を変えない(委譲先: tdd)
- [x] 3.2 `main.tsx`から`ThemeProvider`によるラップを除去する(委譲先: coding。テストを伴わない変更のため)
- [x] 3.3 `ThemeProvider.tsx`/`themeContext.ts`を削除する(委譲先: coding。テストを伴わない変更のため)

## 4. 既存テストの追従(テスト駆動)

- [x] 4.1 `useTheme.test.tsx`をProviderレス(store直接初期化)の構成に書き換える。「ThemeProviderの外で使うとエラー」ケースはstore方式では成立しないため削除する(委譲先: tdd。3.1と同一サイクルで実施済み)
- [x] 4.2 `ThemeSwitch.test.tsx`をProviderレスの構成に書き換える(委譲先: tdd。3.3と同一サイクルで実施済み)

## 5. ドキュメント

- [x] 5.1 README等に状態管理方針(store配置ディレクトリ`src/ui/state/`・命名規則`use<Feature>Store`)を明文化する(委譲先: なし。本スキルで直接編集)
