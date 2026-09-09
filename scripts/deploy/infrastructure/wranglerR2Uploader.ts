import { execFileSync } from 'node:child_process';

const WRANGLER_COMMAND = 'wrangler';
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

export type UploadFileToR2Params = {
  bucketName: string;
  objectKey: string;
  localFilePath: string;
};

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function putObjectToR2(params: UploadFileToR2Params): void {
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

export async function uploadFileToR2(params: UploadFileToR2Params): Promise<void> {
  const { objectKey } = params;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      putObjectToR2(params);
      return;
    } catch (error) {
      const isLastAttempt = attempt === MAX_ATTEMPTS;
      const errorDetail =
        error instanceof Error ? (error as NodeJS.ErrnoException & { stderr?: Buffer | string }).stderr?.toString() ?? error.message : String(error);
      console.warn(`アップロード失敗(${objectKey}, ${attempt}回目): ${errorDetail}`);

      if (isLastAttempt) {
        throw error;
      }

      await wait(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }
}
