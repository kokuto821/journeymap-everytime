/**
 * JourneyMapローカルデータ(`.minecraft/journeymap/data/sp/<world>/`を起点とした
 * 相対パス)のうち、Web配信エクスポート対象を許可リスト方式(デフォルト拒否)で
 * 判定する。fs/URL等の外部依存を持たない純粋関数。
 */

const REGION_TILE_PATTERN = /^overworld\/(day|night|topo|biome)\/-?\d+,-?\d+\.png$/;

const WAYPOINT_DATA_PATTERN = /^waypoints\/WaypointData\.dat$/;

/**
 * @param relativePath `.minecraft/journeymap/data/sp/<world>/`を起点とした相対パス。
 *   区切り文字は`/`固定(呼び出し側でOS依存の区切り文字から正規化すること)。
 */
export function isExportTarget(relativePath: string): boolean {
  return REGION_TILE_PATTERN.test(relativePath) || WAYPOINT_DATA_PATTERN.test(relativePath);
}
