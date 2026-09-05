import 'dotenv/config';
import { listDeployTargetFiles } from './infrastructure/deployTargetFiles.ts';
import { uploadFileToR2 } from './infrastructure/wranglerR2Uploader.ts';
import { EXPORT_OUTPUT_ROOT_DIR } from '../shared/outputRootDir.ts';

// F-005 デプロイスクリプトのエントリファイル。
// deployTargetFiles(アップロード対象一覧の取得)とwranglerR2Uploader(R2へのアップロード)を
// 束ねて実行するオーケストレーション層。

/**
 * 環境変数`CLOUDFLARE_R2_BUCKET_NAME`からR2バケット名を取得する。
 * 未設定(undefinedまたは空文字)の場合はErrorを投げる。
 */
function getR2BucketName(): string {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error(
      '環境変数 CLOUDFLARE_R2_BUCKET_NAME が設定されていません(.env.example を参考に .env を作成してください)',
    );
  }

  return bucketName;
}

/**
 * エクスポート出力ディレクトリ配下の全ファイルをCloudflare R2へフルシンク(全量上書き)アップロードする。
 */
async function main(): Promise<void> {
  const bucketName = getR2BucketName();
  const deployTargetFiles = listDeployTargetFiles(EXPORT_OUTPUT_ROOT_DIR);

  for (const [index, { localFilePath, r2ObjectKey }] of deployTargetFiles.entries()) {
    try {
      uploadFileToR2({
        bucketName,
        objectKey: r2ObjectKey,
        localFilePath,
      });
    } catch (error) {
      throw new Error(
        `アップロードに失敗しました(成功: ${index}件 / 全体: ${deployTargetFiles.length}件, 失敗ファイル: ${localFilePath})`,
        { cause: error },
      );
    }
  }

  console.log(`デプロイが完了しました(処理ファイル数: ${deployTargetFiles.length})`);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
