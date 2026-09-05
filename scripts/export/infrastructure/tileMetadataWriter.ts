import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RegionTileInput } from './tileZoomPyramid.ts';
import type { Layer } from '../domain/exportTargetPolicy.ts';

const TILE_SIZE = 512;
const METADATA_FILE_NAME = 'metadata.json';

export type WriteTileMetadataParams = {
  layerRegionTiles: Partial<Record<Layer, RegionTileInput[]>>;
  zMax: number;
  minZoom: number;
  outputRootDir: string;
};

/** レイヤー1件分の座標範囲(min/max)。 */
type LayerCoordinateRange = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

/**
 * リージョンタイル座標一覧からx/yそれぞれのmin/maxを求める。
 */
function computeCoordinateRange(regionTiles: RegionTileInput[]): LayerCoordinateRange {
  const xs = regionTiles.map((tile) => tile.x);
  const ys = regionTiles.map((tile) => tile.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/**
 * レイヤーごとのリージョンタイル座標一覧から、レイヤーごとの座標範囲一覧を組み立てる。
 */
function buildLayerRanges(
  layerRegionTiles: Partial<Record<Layer, RegionTileInput[]>>,
): Partial<Record<Layer, LayerCoordinateRange>> {
  return Object.fromEntries(
    Object.entries(layerRegionTiles).map(([layer, regionTiles]) => [
      layer,
      computeCoordinateRange(regionTiles),
    ]),
  );
}

/**
 * 各レイヤー(day/night/topo/biome等)のリージョンタイル座標一覧・zMax・minZoomを受け取り、
 * フロントエンドがL.tileLayerの設定(maxBounds/minZoom/maxZoom)に使うメタデータJSONを
 * 組み立てて`<outputRootDir>/metadata.json`に出力する(インフラ層)。
 *
 * minZoom自体の計算(tileZoomPyramid.tsの不動点検出)はスコープ外で、呼び出し側が
 * 計算済みの値を渡す前提とし、この関数はそのまま受け渡すのみ行う。
 */
export function writeTileMetadata({
  layerRegionTiles,
  zMax,
  minZoom,
  outputRootDir,
}: WriteTileMetadataParams): void {
  const metadata = {
    zMax,
    minZoom,
    tileSize: TILE_SIZE,
    layers: buildLayerRanges(layerRegionTiles),
  };

  fs.mkdirSync(outputRootDir, { recursive: true });
  const filePath = path.join(outputRootDir, METADATA_FILE_NAME);
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
}
