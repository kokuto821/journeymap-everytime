import nbt from 'prismarine-nbt';
import { describe, expect, test } from 'vitest';
import { convertWaypointDataToJson } from '../waypointConverter.ts';

// convertWaypointDataToJson(waypointDataBuffer: Buffer): unknown
//
// JourneyMapが出力する`waypoints/WaypointData.dat`(NBT形式、GZip圧縮無しの生NBT)の
// バイナリを受け取り、JSON化可能なプレーンオブジェクトに変換する(インフラ層)。
// ファイル読み込み(fs)は担当せず、Bufferを直接受け取る。
//
// 実データファイルは使わず、prismarine-nbtのエンコード機能でテスト用NBTバイナリを
// その場で組み立て、変換関数でデコード→JSON化させて検証する「往復テスト」方式で行う。
// prismarine-nbtの中間表現(`{type, value}`のタグ型ラッパー)を含まない、
// 素のキー・値だけのプレーンオブジェクトになることをtoStrictEqualで厳密に検証する。
//
// long型(64bit整数)はNumberでは精度を失うため文字列化する方針、
// 配列型タグ(byte-array/int-array/long-array)は通常のJS配列(number[])として
// 表現する方針を、それぞれ固定する。

/**
 * prismarine-nbtのビルダー関数(`nbt.comp`/`nbt.long`等)が返す値は、
 * 同梱の型定義(`NBT`/`Long`型)より実際には柔軟(`name`省略可、long値にBigInt可等)であり、
 * 型定義と実際のビルダーの戻り値型が一致しない(ライブラリ側の型定義の不備)。
 * テストコード側の可読性を優先し、型不一致の吸収はこの1箇所に集約する。
 */
function writeUncompressed(tag: unknown): Buffer {
  return nbt.writeUncompressed(tag as Parameters<typeof nbt.writeUncompressed>[0]);
}

describe('convertWaypointDataToJson', () => {
  describe('基本タグの変換', () => {
    test('string/intの基本タグを含むNBTバイナリを変換したらタグ型ラッパーを除去したプレーンオブジェクトになる', () => {
      // Arrange
      const waypointDataBuffer = writeUncompressed(
        nbt.comp({
          name: nbt.string('拠点'),
          count: nbt.int(42),
        }),
      );

      // Act
      const result = convertWaypointDataToJson(waypointDataBuffer);

      // Assert
      expect(result).toStrictEqual({
        name: '拠点',
        count: 42,
      });
    });
  });

  describe('実データ相当のネスト構造', () => {
    test('waypoints/groups/journeymap_default配下にwaypointエントリを持つNBTバイナリを変換したら階層構造を保ったプレーンオブジェクトになる', () => {
      // Arrange
      const waypointDataBuffer = writeUncompressed(
        nbt.comp({
          waypoints: nbt.comp({
            groups: nbt.comp({
              journeymap_default: nbt.comp({
                'waypoint-id-1': nbt.comp({
                  icon: nbt.string('minecraft:textures/gui/waypoint.png'),
                  opacity: nbt.double(1.0),
                  resourceLocation: nbt.string('minecraft:overworld'),
                }),
              }),
            }),
          }),
        }),
      );

      // Act
      const result = convertWaypointDataToJson(waypointDataBuffer);

      // Assert
      expect(result).toStrictEqual({
        waypoints: {
          groups: {
            journeymap_default: {
              'waypoint-id-1': {
                icon: 'minecraft:textures/gui/waypoint.png',
                opacity: 1,
                resourceLocation: 'minecraft:overworld',
              },
            },
          },
        },
      });
    });
  });

  describe('複数エントリのList', () => {
    test('複数waypointエントリを持つList of CompoundのNBTバイナリを変換したらJS配列として複数エントリが得られる', () => {
      // Arrange
      const waypointDataBuffer = writeUncompressed(
        nbt.comp({
          waypointList: nbt.list(
            nbt.comp([
              { icon: nbt.string('icon-a'), opacity: nbt.double(1.0) },
              { icon: nbt.string('icon-b'), opacity: nbt.double(0.5) },
            ]),
          ),
        }),
      );

      // Act
      const result = convertWaypointDataToJson(waypointDataBuffer);

      // Assert
      expect(result).toStrictEqual({
        waypointList: [
          { icon: 'icon-a', opacity: 1 },
          { icon: 'icon-b', opacity: 0.5 },
        ],
      });
    });
  });

  describe('long型の文字列化', () => {
    test('Number.MAX_SAFE_INTEGERを超えるlong型フィールドを含むNBTバイナリを変換したら精度を失わない文字列になる', () => {
      // Arrange
      const longValueExceedingMaxSafeInteger = 9223372036854775807n;
      const waypointDataBuffer = writeUncompressed(
        nbt.comp({
          createdAt: nbt.long(longValueExceedingMaxSafeInteger),
        }),
      );

      // Act
      const result = convertWaypointDataToJson(waypointDataBuffer);

      // Assert
      expect(result).toStrictEqual({
        createdAt: '9223372036854775807',
      });
    });
  });

  describe('配列型タグの変換', () => {
    test('int-arrayタグを含むNBTバイナリを変換したら通常のJS配列(number[])になる', () => {
      // Arrange
      const waypointDataBuffer = writeUncompressed(
        nbt.comp({
          colorValues: nbt.intArray([1, -2, 2147483647]),
        }),
      );

      // Act
      const result = convertWaypointDataToJson(waypointDataBuffer);

      // Assert
      expect(result).toStrictEqual({
        colorValues: [1, -2, 2147483647],
      });
    });
  });

  describe('日本語・空文字を含む文字列', () => {
    test('日本語と空文字列を値に持つNBTバイナリを変換したら文字列として正しくデコードされる', () => {
      // Arrange
      const waypointDataBuffer = writeUncompressed(
        nbt.comp({
          japaneseName: nbt.string('拠点：日本語の目印'),
          emptyName: nbt.string(''),
        }),
      );

      // Act
      const result = convertWaypointDataToJson(waypointDataBuffer);

      // Assert
      expect(result).toStrictEqual({
        japaneseName: '拠点：日本語の目印',
        emptyName: '',
      });
    });
  });

  describe('空のCompound・空のList', () => {
    test('空のCompoundと要素数0のListを含むNBTバイナリを変換したらそれぞれ空オブジェクト・空配列になる', () => {
      // Arrange
      const waypointDataBuffer = writeUncompressed(
        nbt.comp({
          emptyGroup: nbt.comp({}),
          emptyList: nbt.list({ type: 'string', value: [] }),
        }),
      );

      // Act
      const result = convertWaypointDataToJson(waypointDataBuffer);

      // Assert
      expect(result).toStrictEqual({
        emptyGroup: {},
        emptyList: [],
      });
    });
  });

  describe('不正バイナリでの例外', () => {
    test('NBTとしてデコードできない不正なバイナリを渡したら例外がthrowされる', () => {
      // Arrange
      const invalidBuffer = Buffer.from([0x01, 0x02, 0x03]);

      // Act
      const act = () => convertWaypointDataToJson(invalidBuffer);

      // Assert
      expect(act).toThrow();
    });
  });
});
