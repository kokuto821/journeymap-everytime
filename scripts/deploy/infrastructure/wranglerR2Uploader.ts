import { execFileSync } from 'node:child_process';

const WRANGLER_COMMAND = 'wrangler';
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;
const FIRST_ATTEMPT_NUMBER = 1;
const EXPONENTIAL_BACKOFF_BASE = 2;

export type UploadFileToR2Params = {
  bucketName: string;
  objectKey: string;
  localFilePath: string;
};

const wait = (delayMs: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

const putObjectToR2 = (params: UploadFileToR2Params): void => {
  const { bucketName, objectKey, localFilePath } = params;

  execFileSync(WRANGLER_COMMAND, [
    'r2',
    'object',
    'put',
    `${bucketName}/${objectKey}`,
    `--file=${localFilePath}`,
    '--remote',
  ]);
};

export const uploadFileToR2 = async (params: UploadFileToR2Params): Promise<void> => {
  const { objectKey } = params;

  for (let attempt = FIRST_ATTEMPT_NUMBER; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      putObjectToR2(params);
      return;
    } catch (error) {
      const isLastAttempt = attempt === MAX_ATTEMPTS;
      const errorDetail =
        error instanceof Error
          ? ((error as NodeJS.ErrnoException & { stderr?: Buffer | string }).stderr?.toString() ??
            error.message)
          : String(error);
      console.warn(`アップロード失敗(${objectKey}, ${attempt}回目): ${errorDetail}`);

      if (isLastAttempt) {
        throw error;
      }

      await wait(
        RETRY_BASE_DELAY_MS * EXPONENTIAL_BACKOFF_BASE ** (attempt - FIRST_ATTEMPT_NUMBER),
      );
    }
  }
};
