/**
 * JourneyMapローカルデータ(`.minecraft/journeymap/data/sp/<world>/`を起点とした
 * 相対パス)のうち、Web配信エクスポート対象を許可リスト方式(デフォルト拒否)で
 * 判定する。fs/URL等の外部依存を持たない純粋関数。
 */

/**
 * JourneyMapが出力するレイヤー種別。エクスポート対象判定(`REGION_TILE_PATTERN`)と、
 * リージョンタイルを実際に読み書きするインフラ層(`exportFileWriter.ts`・
 * `tileMetadataWriter.ts`)の双方から参照される唯一の定義箇所。
 */
export const LAYERS = ['day', 'night', 'topo', 'biome'] as const;

/** `LAYERS`の要素を表すリテラル型。day/night/topo/biome以外の値を型レベルで排除する。 */
export type Layer = (typeof LAYERS)[number];

const REGION_TILE_PATTERN = new RegExp(`^overworld\\/(${LAYERS.join('|')})\\/-?\\d+,-?\\d+\\.png$`);

/**
 * JourneyMapが出力するwaypointデータファイルの相対パス。
 * エクスポート対象判定(`WAYPOINT_DATA_PATTERN`)と、実際にこのファイルを読み込む
 * インフラ層(`exportFileWriter.ts`)の双方から参照される唯一の定義箇所。
 */
export const WAYPOINT_DATA_RELATIVE_PATH = 'waypoints/WaypointData.dat';

const WAYPOINT_DATA_PATTERN = new RegExp(
  `^${WAYPOINT_DATA_RELATIVE_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
);

/**
 * @param relativePath `.minecraft/journeymap/data/sp/<world>/`を起点とした相対パス。
 *   区切り文字は`/`固定(呼び出し側でOS依存の区切り文字から正規化すること)。
 */
export function isExportTarget(relativePath: string): boolean {
  return REGION_TILE_PATTERN.test(relativePath) || WAYPOINT_DATA_PATTERN.test(relativePath);
}
