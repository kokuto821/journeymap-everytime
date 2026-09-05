import { beforeEach, describe, expect, test, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { uploadFileToR2 } from '../wranglerR2Uploader.ts';

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
}));

// uploadFileToR2(params: { bucketName: string; objectKey: string; localFilePath: string }): void
// wranglerコマンドを使ってローカルファイルをR2バケットへアップロードする。

describe('uploadFileToR2', () => {
  beforeEach(() => {
    vi.mocked(execFileSync).mockReset();
  });

  describe('正常系', () => {
    test('uploadFileToR2を呼んだら正しいコマンド・引数でexecFileSyncを呼び出す', () => {
      // Arrange
      const params = {
        bucketName: 'my-bucket',
        objectKey: 'overworld/day/0,0.png',
        localFilePath: '/tmp/x/overworld/day/0,0.png',
      };

      // Act
      uploadFileToR2(params);

      // Assert
      expect(execFileSync).toHaveBeenCalledWith('wrangler', [
        'r2',
        'object',
        'put',
        'my-bucket/overworld/day/0,0.png',
        '--file=/tmp/x/overworld/day/0,0.png',
        '--remote',
      ]);
    });
  });
});
