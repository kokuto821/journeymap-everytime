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
