import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
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

  afterEach(() => {
    vi.useRealTimers();
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

    test.todo('1回失敗して2回目に成功したらexecFileSyncが2回呼ばれる');
    test.todo('1回失敗して2回目に成功したら例外が伝播しない');
  });

  describe('リトライ', () => {
    test.todo('1回目失敗後、1000ms待機してから2回目のリトライを行う');
    test.todo('2回目も失敗した場合、2000ms待機してから3回目のリトライを行う');
    test.todo('失敗するたびにconsole.warnでファイル名と試行回数をログ出力する');
  });

  describe('異常系', () => {
    test('リトライ上限(3回)を超えて失敗し続けたら例外が呼び出し元に伝播する', async () => {
      // Arrange
      vi.useFakeTimers();
      const error = new Error('fetch failed');
      vi.mocked(execFileSync).mockImplementation(() => {
        throw error;
      });
      const params = {
        bucketName: 'my-bucket',
        objectKey: 'overworld/day/0,0.png',
        localFilePath: '/tmp/x/overworld/day/0,0.png',
      };

      // Act
      const actual = uploadFileToR2(params);
      const assertion = expect(actual).rejects.toThrow(error);
      await vi.runAllTimersAsync();

      // Assert
      await assertion;
      expect(execFileSync).toHaveBeenCalledTimes(3);
    });

    test.todo('リトライ上限を超えて失敗したら、それ以上execFileSyncを呼ばない');
  });
});
