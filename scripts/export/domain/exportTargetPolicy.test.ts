import { describe, expect, test } from 'vitest';
import { isExportTarget } from './exportTargetPolicy.ts';

// isExportTarget(relativePath: string): boolean
// JourneyMapローカルデータの `.minecraft/journeymap/data/sp/<world>/` を起点とした
// 相対パス(POSIX区切り)を受け取り、Web配信エクスポート対象かどうかをallowlist方式
// (デフォルト拒否)で判定する純粋関数。テストでは起点より下(overworld/... や
// waypoints/...)のパスのみを渡す前提とする。
describe('isExportTarget', () => {
  describe('正常系: 対象と判定されるパス', () => {
    test('day配下のリージョンpngファイルを渡したら対象と判定する', () => {
      // Act
      const result = isExportTarget('overworld/day/-4,3.png');

      // Assert
      expect(result).toBe(true);
    });

    test('night配下のリージョンpngファイルを渡したら対象と判定する', () => {
      // Act
      const result = isExportTarget('overworld/night/-4,3.png');

      // Assert
      expect(result).toBe(true);
    });

    test('topo配下のリージョンpngファイルを渡したら対象と判定する', () => {
      // Act
      const result = isExportTarget('overworld/topo/-4,3.png');

      // Assert
      expect(result).toBe(true);
    });

    test('biome配下のリージョンpngファイルを渡したら対象と判定する', () => {
      // Act
      const result = isExportTarget('overworld/biome/-4,3.png');

      // Assert
      expect(result).toBe(true);
    });

    test('waypoints配下のWaypointData.datを渡したら対象と判定する', () => {
      // Act
      const result = isExportTarget('waypoints/WaypointData.dat');

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('否定側・境界値: 対象外と判定されるパス', () => {
    test('chunk_cache配下のファイルを渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('overworld/chunk_cache/-4,3.png');

      // Assert
      expect(result).toBe(false);
    });

    test('pngでも座標,座標形式でもないファイル(lod系ファイル)を渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('overworld/day/lod1.jmd');

      // Assert
      expect(result).toBe(false);
    });

    test('night配下のlod3.jmmを渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('overworld/night/lod3.jmm');

      // Assert
      expect(result).toBe(false);
    });

    test('負の数値ディレクトリ配下のファイルを渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('overworld/-4/foo.png');

      // Assert
      expect(result).toBe(false);
    });

    test('正の数値ディレクトリ配下のファイルを渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('overworld/23/foo.png');

      // Assert
      expect(result).toBe(false);
    });

    test('座標部分が数値でないリージョンファイル名を渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('overworld/day/abc,def.png');

      // Assert
      expect(result).toBe(false);
    });

    test('カンマが無いリージョンファイル名を渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('overworld/day/43.png');

      // Assert
      expect(result).toBe(false);
    });

    test('拡張子がpng以外のリージョンファイル名を渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('overworld/day/-4,3.jpg');

      // Assert
      expect(result).toBe(false);
    });

    test('拡張子が無いリージョンファイル名を渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('overworld/day/-4,3');

      // Assert
      expect(result).toBe(false);
    });

    test('waypoints配下の別ファイルを渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('waypoints/OtherFile.dat');

      // Assert
      expect(result).toBe(false);
    });

    test('waypoints配下のサブディレクトリにあるWaypointData.datを渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('waypoints/sub/WaypointData.dat');

      // Assert
      expect(result).toBe(false);
    });

    test('空文字列を渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('');

      // Assert
      expect(result).toBe(false);
    });

    test('パストラバーサル文字列を渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('../../etc/passwd');

      // Assert
      expect(result).toBe(false);
    });

    test('allowlistのいずれにも該当しない未知のパスを渡したら対象外と判定する', () => {
      // Act
      const result = isExportTarget('the_nether/day/0,0.png');

      // Assert
      expect(result).toBe(false);
    });
  });
});
