import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { toPosixPath, walkFiles } from '../fileWalker.ts';
import { createFile } from '../../_test_/fsTestHelpers.ts';

describe('walkFiles', () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-walker-'));
  });

  afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  test('ネストしたファイルがあれば再帰的に列挙する', () => {
    // Arrange
    createFile(rootDir, 'overworld/day/0,0.png');
    createFile(rootDir, 'overworld/night/tiles/-1,2.png');

    // Act
    const result = walkFiles(rootDir);

    // Assert
    expect(result.slice().sort()).toStrictEqual(
      [
        path.join('overworld', 'day', '0,0.png'),
        path.join('overworld', 'night', 'tiles', '-1,2.png'),
      ].sort(),
    );
  });

  test('ファイルを列挙したらネイティブのパス区切りの相対パスを返す', () => {
    // Arrange
    createFile(rootDir, 'waypoints/WaypointData.dat');

    // Act
    const result = walkFiles(rootDir);

    // Assert
    expect(result).toStrictEqual([path.join('waypoints', 'WaypointData.dat')]);
  });
});

describe('toPosixPath', () => {
  test('バックスラッシュ区切りのパスを渡したら/区切りに変換する', () => {
    // Arrange
    const backslashSeparatedPath = 'overworld\\day\\-4,3.png';

    // Act
    const result = toPosixPath(backslashSeparatedPath);

    // Assert
    expect(result).toBe('overworld/day/-4,3.png');
  });
});
