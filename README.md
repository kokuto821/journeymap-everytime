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
