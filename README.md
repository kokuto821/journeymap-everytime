# journeymap-everytime

Minecraft JourneyMap の地図タイルをWebで閲覧するための個人開発Webアプリ(MVP)。
詳細な要件は `要件定義書_マイクラMAPエディター_v0.3.md` を参照。

## 必要環境

- Node.js v20以上(開発時確認バージョン: v24.14.1)
- npm

## セットアップ

```bash
npm install
```

## 開発サーバーの起動

地図ビュー(F-001)の表示にはR2バケットの公開ベースURLが必要。`.env`(`.env.example`をコピーして作成)に設定する:

```
VITE_R2_BASE_URL=<R2バケットの公開ベースURL>
```

```bash
npm run dev
```

起動後、表示されるURL(通常は http://localhost:5173 )にアクセスする。

## Lint / Format

```bash
npm run lint          # ESLintでコードチェック
npm run lint:fix      # ESLintで自動修正
npm run format        # Prettierでフォーマット
npm run format:check  # フォーマット崩れのチェックのみ
```

## ビルド

```bash
npm run build
```

## スタイリング方針

Tailwind CSS v4(CSS-first、`@tailwindcss/vite`)を導入済み。今後のコンポーネント実装(F-002レイヤー切替・F-003座標表示等)もTailwindのユーティリティクラスで実装する方針。テーマ用CSS変数(`src/styles/tokens.css`・`src/styles/theme.css`)は`src/index.css`の`@theme`でTailwindのセマンティックトークンにエイリアスして使う。

## 状態管理方針

グローバルなUI状態(テーマ選択、今後のレイヤー切替・座標表示等)にはzustandを使う。React ContextやコンポーネントローカルなuseStateでのバケツリレー・Provider肥大化を避けるための採用(#36)。

- **配置ディレクトリ**: `src/ui/state/`(オニオンアーキテクチャのui層内)。ドメイン型への依存は許容するが、domain/infrastructure層からui層のstoreへは依存させない
- **命名規則**: 機能単位で1ファイル、`use<Feature>Store.ts`(例: `useThemeStore.ts`)。exportするフックは`use<Feature>Store`
- 既存コンポーネントからは、storeを直接参照する薄いラッパーフック(例: `useTheme.ts`)経由でアクセスする構成を維持する

## マップデータのデプロイ(scripts/deploy)

JourneyMapのローカルデータをエクスポートし(`npm run export:map-data`。詳細は要件定義書・エクスポート結果ディレクトリ `scripts/export/output/` を参照)、その出力結果をCloudflare R2バケットへフルシンク(全量上書き)アップロードするスクリプト。

### 事前準備

1. Cloudflareアカウントでログインする(初回のみ):

   ```bash
   npx wrangler login
   ```

   CI等、ブラウザ認証を使えない環境では代わりに環境変数 `CLOUDFLARE_API_TOKEN` にAPIトークンを設定する(Wrangler CLI自体の認証情報は `.env` やこのリポジトリには書かない)。

2. アップロード先のCloudflare R2バケットをあらかじめ作成しておく。
3. `.env`(`.env.example`をコピーして作成)に、作成したR2バケット名を設定する:

   ```
   CLOUDFLARE_R2_BUCKET_NAME=<R2バケット名>
   ```

### 実行

```bash
npm run deploy:map-data
```

`scripts/export/output/` 配下の全ファイルをR2バケットへ上書きアップロードする。差分検出は行わず、毎回全ファイルを対象とする(個人利用規模ではR2無料枠に十分余裕があるための判断)。アップロード中に失敗した場合は非ゼロ終了コードで終了する(新旧タイルの混在は許容し、ロールバックは行わない)。
