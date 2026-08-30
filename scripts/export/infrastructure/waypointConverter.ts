import nbt from 'prismarine-nbt';

/**
 * long型タグの実行時の値表現。
 *
 * `prismarine-nbt`の型定義(`Long`)は`[number, number]`としているが、
 * 実際のデコード結果は`bigint`(または`toString()`で文字列化できる値)であり、
 * 型定義と実装が一致していない(ライブラリ側の型定義の不備)。
 * 精度を失わない文字列化にのみ`toString()`を使うため、この形で吸収する。
 */
type LongLike = { toString(): string };

type NbtTag = { type: string; value: unknown };

/**
 * NBTのタグ型ラッパー(`{type, value}`)1件を、JSON化可能なプレーンな値に変換する。
 *
 * - `compound`: キーごとに再帰変換したプレーンオブジェクト
 * - `list`: 要素ごとに再帰変換したJS配列(要素型が`compound`の場合、
 *   デコード結果は`{type, value}`ラップの無い生のCompound値のため、
 *   `list`の要素型を補って再帰変換する)
 * - `long`: 精度を失わないよう文字列化
 * - `byteArray`/`shortArray`/`intArray`/`longArray`: 通常のJS配列(`long`系はさらに文字列化)
 * - 上記以外(基本タグ): 値をそのまま返す
 */
function convertTagValue(tagType: string, value: unknown): unknown {
  switch (tagType) {
    case 'compound':
      return convertCompoundValue(value as Record<string, NbtTag | undefined>);
    case 'list': {
      const list = value as { type: string; value: unknown[] };
      return list.value.map((item) => convertTagValue(list.type, item));
    }
    case 'long':
      return (value as LongLike).toString();
    case 'longArray':
      return (value as LongLike[]).map((item) => item.toString());
    default:
      return value;
  }
}

/**
 * Compoundタグの中身(キーと`{type, value}`のRecord)を、
 * タグ型ラッパーを除去したプレーンオブジェクトに変換する。
 */
function convertCompoundValue(compoundValue: Record<string, NbtTag | undefined>): unknown {
  const result: Record<string, unknown> = {};

  for (const [key, tag] of Object.entries(compoundValue)) {
    if (tag === undefined) {
      continue;
    }
    result[key] = convertTagValue(tag.type, tag.value);
  }

  return result;
}

/**
 * JourneyMapが出力する`waypoints/WaypointData.dat`(NBT形式、GZip圧縮無しの生NBT)の
 * バイナリを受け取り、`prismarine-nbt`でデコードした後、タグ型ラッパー(`{type, value}`)を
 * 除去したプレーンオブジェクトに変換する(インフラ層)。
 * ファイル読み込み(fs)は担当せず、Bufferを直接受け取る。
 *
 * デコードできない不正なバイナリを渡した場合、`prismarine-nbt`がthrowする例外を
 * そのまま呼び出し元に伝播させる。
 */
export function convertWaypointDataToJson(waypointDataBuffer: Buffer): unknown {
  const parsed = nbt.parseUncompressed(waypointDataBuffer);

  return convertCompoundValue(parsed.value as Record<string, NbtTag | undefined>);
}
