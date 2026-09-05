import { execFileSync } from 'node:child_process';

const WRANGLER_COMMAND = 'wrangler';

export type UploadFileToR2Params = {
  bucketName: string;
  objectKey: string;
  localFilePath: string;
};

/**
 * wranglerコマンドを使ってローカルファイルをR2バケットへアップロードする。
 * wranglerが非ゼロ終了した場合、execFileSyncの例外をそのまま呼び出し元へ伝播する
 * (ここでは独自にラップしない。非ゼロ終了時の扱いは呼び出し元の責務とする)。
 */
export function uploadFileToR2(params: UploadFileToR2Params): void {
  const { bucketName, objectKey, localFilePath } = params;

  execFileSync(WRANGLER_COMMAND, [
    'r2',
    'object',
    'put',
    `${bucketName}/${objectKey}`,
    `--file=${localFilePath}`,
    '--remote',
  ]);
}
