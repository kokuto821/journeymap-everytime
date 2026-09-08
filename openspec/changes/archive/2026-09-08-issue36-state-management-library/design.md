## Context

現状のテーマ選択状態はReact Context(`ThemeContext`/`ThemeProvider`/`useTheme`)で管理している(`src/ui/theme/`)。`ThemeProvider`は`useState`+`useEffect`で`themeName`を保持し、ルート要素の`data-theme`属性へ反映する。今後F-002(レイヤー切替)・F-003(座標表示)で同種の共有状態が増える見込み(proposal.md参照)。

アーキテクチャは domain/infrastructure/ui のオニオン構成(README参照)。テーマ選択の型定義(`ThemeName`)は`src/domain/theme/`に置かれており、UI側の状態管理実装はこのdomain型に依存する形を維持する。

## Goals / Non-Goals

**Goals:**
- 新規グローバルUI状態を追加する際の置き場所・命名規則を確立する
- 既存の`useTheme`フックの呼び出し側(呼び出しシグネチャ: `{ themeName, setThemeName }`)を変えずに内部実装を置き換える

**Non-Goals:**
- レイヤー選択(#21)・座標表示(#22)自体の実装(store配置規約の適用は将来のissueで行う)
- テーマ設定の永続化(localStorage等)。現状も未実装であり、本変更でも対象外

## Decisions

### 採用ライブラリ: zustand

比較対象は jotai(atomベース、useState に近い書き味、Provider任意) と zustand(store+selectorベース、Provider不要、Reactツリー外からもアクセス可能)。

zustandを採用する。理由:
- 現時点で管理する状態(テーマ・将来のレイヤー選択・座標)は少数の独立した値であり、atom単位の細粒度な依存管理(jotaiの強み)が活きる場面が今は無い
- `create()`で単一storeを定義しselectorで必要な値だけ購読できるため、Provider・Contextのネストが不要になり、issueの動機(Provider肥大化の回避)に直接合致する
- Reactツリー外からのstore参照が容易で、将来的にReact外のコード(将来のエクスポート/デプロイスクリプト等)から状態を参照する可能性にも対応しやすい

### store配置・命名規則

- 配置ディレクトリ: `src/ui/state/`(オニオンアーキテクチャのui層内。ドメイン型への依存は許容するが、domain/infrastructure層からui層のstoreへは依存させない)
- ファイル名・命名規則: 機能単位で1ファイル、`use<Feature>Store.ts`(例: `useThemeStore.ts`)。exportするフックは`use<Feature>Store`
- 既存の`useTheme.ts`は`useThemeStore`への薄いラッパーとして残し、呼び出し側のシグネチャ(`{ themeName, setThemeName }`)を変えない

### data-theme属性への反映方法

`ThemeProvider`の`useEffect`が担っていた「`themeName`変更時にルート要素の`data-theme`属性を更新する」処理は、zustandの`subscribe`を使いstore定義側(`useThemeStore.ts`)に持たせる。Reactのライフサイクルに依存させず、Provider撤去後も同じ副作用が発生するようにする。

## Risks / Trade-offs

- [Providerの`initialThemeName` propsによるテスト時の初期値注入ができなくなる] → storeに初期値を上書きする関数(例: `useThemeStore.setState`)をテストの`beforeEach`等で呼び出す形に置き換える。テスト間の状態リークを避けるため、各テストでリセットする
- [Provider撤去に伴い`App.tsx`/`main.tsxの構成が変わる] → 既存テスト(`ThemeSwitch.test.tsx`等)がProviderでラップして描画している場合は、ラップ不要になった旨をテストコード側にも反映する
