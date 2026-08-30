import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { readJourneyMapFiles, toPosixPath } from './journeyMapFileReader.ts';

// readJourneyMapFiles(worldRootDir: string): string[]
// ワールドセーブのローカルディレクトリ(実ファイルシステム)を再帰的に走査し、
// exportTargetPolicy.isExportTarget によるエクスポート対象ファイルのみを
// `worldRootDir` からの相対パス(`/`区切りに正規化済み)の配列として返す。
// 実ファイルシステム上に一時ディレクトリを作成して走査させる方式で検証する(fsのモックは使わない)。
//
// 対象/対象外の分類ルール自体の網羅的な検証は exportTargetPolicy.test.ts で行う。
// ここでは「実ディレクトリを再帰走査し、isExportTarget の判定結果に従って相対パスを返す」
// という走査層固有の関心事(代表ケースでの委譲確認・パス正規化・混在時の絞り込み)のみを検証する。

/**
 * `worldDir` を起点に、`/`区切りの相対パスで空ファイルを1件作成する。
 * 親ディレクトリが無ければ再帰的に作成する。
 */
function createFile(worldDir: string, relativePath: string): void {
  const fullPath = path.join(worldDir, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, '');
}

describe('readJourneyMapFiles', () => {
  let worldDir: string;

  beforeEach(() => {
    worldDir = fs.mkdtempSync(path.join(os.tmpdir(), 'journeymap-file-reader-'));
  });

  afterEach(() => {
    fs.rmSync(worldDir, { recursive: true, force: true });
  });

  describe('正常系: 対象ファイルが走査結果に含まれる(代表ケース)', () => {
    test('day配下の負値座標を含む対象ファイルを走査したら結果に含む', () => {
      // Arrange
      createFile(worldDir, 'overworld/day/-4,3.png');

      // Act
      const result = readJourneyMapFiles(worldDir);

      // Assert
      expect(result).toContain('overworld/day/-4,3.png');
    });
  });

  describe('対象外: 走査結果に含まれない(代表ケース)', () => {
    test('chunk_cache配下のファイルを走査したら結果に含まない', () => {
      // Arrange
      createFile(worldDir, 'overworld/chunk_cache/1,2.png');

      // Act
      const result = readJourneyMapFiles(worldDir);

      // Assert
      expect(result).not.toContain('overworld/chunk_cache/1,2.png');
    });
  });

  describe('走査層固有の関心事: パス正規化', () => {
    test('バックスラッシュ区切りのパスを渡したら/区切りに変換する', () => {
      // Arrange
      const backslashSeparatedPath = 'overworld\\day\\-4,3.png';

      // Act
      const result = toPosixPath(backslashSeparatedPath);

      // Assert
      expect(result).toBe('overworld/day/-4,3.png');
    });
  });

  describe('統合シナリオ', () => {
    test('対象/対象外が混在するツリーを走査したら対象ファイルのみが含まれる', () => {
      // Arrange
      createFile(worldDir, 'overworld/day/1,2.png');
      createFile(worldDir, 'overworld/night/-1,-2.png');
      createFile(worldDir, 'overworld/topo/0,0.png');
      createFile(worldDir, 'overworld/biome/3,-3.png');
      createFile(worldDir, 'waypoints/WaypointData.dat');
      createFile(worldDir, 'overworld/chunk_cache/1,2.png');
      createFile(worldDir, 'overworld/day/lod3.jmd');
      createFile(worldDir, 'overworld/night/lod1.jmm');
      createFile(worldDir, 'overworld/4/1,2.png');
      createFile(worldDir, 'waypoints/backup.dat');

      // Act
      const result = readJourneyMapFiles(worldDir);

      // Assert
      expect(result.slice().sort()).toEqual(
        [
          'overworld/day/1,2.png',
          'overworld/night/-1,-2.png',
          'overworld/topo/0,0.png',
          'overworld/biome/3,-3.png',
          'waypoints/WaypointData.dat',
        ].sort(),
      );
    });

    test('waypoints配下にWaypointData.dat以外のファイルがあったら結果に含まない', () => {
      // Arrange
      createFile(worldDir, 'waypoints/WaypointData.dat');
      createFile(worldDir, 'waypoints/backup.dat');

      // Act
      const result = readJourneyMapFiles(worldDir);

      // Assert
      expect(result).not.toContain('waypoints/backup.dat');
    });
  });

  describe('空ディレクトリ', () => {
    test('対象ファイルが1つも無いディレクトリを走査したら空配列が返る', () => {
      // Act
      const result = readJourneyMapFiles(worldDir);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('異常系: ワールドディレクトリが存在しない', () => {
    test('存在しないワールドディレクトリを渡したら明確なエラーメッセージで例外を投げる', () => {
      // Arrange
      const nonExistentWorldDir = path.join(worldDir, 'not-exist-world');

      // Act
      const act = () => readJourneyMapFiles(nonExistentWorldDir);

      // Assert
      expect(act).toThrowError(`ワールドディレクトリが見つかりません: ${nonExistentWorldDir}`);
    });
  });
});
