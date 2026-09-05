import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { listDeployTargetFiles } from '../deployTargetFiles.ts';
import { createFile } from '../../../_test_/fsTestHelpers.ts';

// listDeployTargetFiles(outputRootDir: string): { localFilePath: string; r2ObjectKey: string }[]
// エクスポート出力ルートディレクトリ(実ファイルシステム)を再帰的に走査し、
// ファイルのみを対象に、ローカルの絶対パスとR2オブジェクトキー(出力ルートディレクトリからの
// 相対パスを`/`区切りに正規化したもの)の組を返す。

describe('listDeployTargetFiles', () => {
  let outputRootDir: string;

  beforeEach(() => {
    outputRootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-target-files-'));
  });

  afterEach(() => {
    fs.rmSync(outputRootDir, { recursive: true, force: true });
  });

  describe('ネストしたファイルの再帰列挙', () => {
    test('出力ルートディレクトリ配下にネストしたファイルがあれば全ファイルを再帰的に列挙する', () => {
      // Arrange
      createFile(outputRootDir, 'overworld/day/0,0.png');
      createFile(outputRootDir, 'overworld/night/tiles/-1,2.png');
      createFile(outputRootDir, 'waypoints/WaypointData.dat');

      // Act
      const result = listDeployTargetFiles(outputRootDir);

      // Assert
      expect(result.slice().sort((a, b) => a.r2ObjectKey.localeCompare(b.r2ObjectKey))).toStrictEqual(
        [
          {
            localFilePath: path.join(outputRootDir, 'overworld/day/0,0.png'),
            r2ObjectKey: 'overworld/day/0,0.png',
          },
          {
            localFilePath: path.join(outputRootDir, 'overworld/night/tiles/-1,2.png'),
            r2ObjectKey: 'overworld/night/tiles/-1,2.png',
          },
          {
            localFilePath: path.join(outputRootDir, 'waypoints/WaypointData.dat'),
            r2ObjectKey: 'waypoints/WaypointData.dat',
          },
        ].sort((a, b) => a.r2ObjectKey.localeCompare(b.r2ObjectKey)),
      );
    });
  });

  describe('空ディレクトリ', () => {
    test('出力ルートディレクトリが1つも無いディレクトリを走査したら空配列が返る', () => {
      // Act
      const result = listDeployTargetFiles(outputRootDir);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('異常系: 出力ルートディレクトリが存在しない', () => {
    test('存在しない出力ルートディレクトリを渡したら明確なエラーメッセージで例外を投げる', () => {
      // Arrange
      const nonExistentOutputRootDir = path.join(outputRootDir, 'not-exist-output');

      // Act
      const act = () => listDeployTargetFiles(nonExistentOutputRootDir);

      // Assert
      expect(act).toThrowError(
        `デプロイ対象の出力ルートディレクトリが見つかりません: ${nonExistentOutputRootDir}`,
      );
    });
  });
});
