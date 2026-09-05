import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateTileZoomPyramid, type RegionTileInput } from './tileZoomPyramid.ts';
import { convertWaypointDataToJson } from './waypointConverter.ts';
import { writeTileMetadata } from './tileMetadataWriter.ts';
import { LAYERS, WAYPOINT_DATA_RELATIVE_PATH, type Layer } from '../domain/exportTargetPolicy.ts';

const WAYPOINT_JSON_FILE_NAME = 'waypoints.json';

// リージョンタイル画像のファイル名(例: `-4,3.png`)からx,y座標を抽出するパターン
const REGION_TILE_FILE_NAME_PATTERN = /^(-?\d+),(-?\d+)\.png$/;

export type WriteExportFilesParams = {
  relativePaths: string[];
  worldRootDir: string;
  outputRootDir: string;
  zMax: number;
};

type RegionCoordinate = { x: number; y: number };

/**
 * `overworld/<layer>/<x>,<y>.png`形式の相対パスからregion座標を抽出する。
 * 一致しない相対パスは`undefined`を返す。
 */
function parseRegionTilePath(
  relativePath: string,
  layer: Layer,
): RegionCoordinate | undefined {
  const prefix = `overworld/${layer}/`;
  if (!relativePath.startsWith(prefix)) {
    return undefined;
  }

  const fileName = relativePath.slice(prefix.length);
  const regionTileFileNameMatch = REGION_TILE_FILE_NAME_PATTERN.exec(fileName);
  if (!regionTileFileNameMatch) {
    return undefined;
  }

  return {
    x: Number(regionTileFileNameMatch[1]),
    y: Number(regionTileFileNameMatch[2]),
  };
}

type BuildRegionTilesParams = {
  relativePaths: string[];
  worldRootDir: string;
  layer: Layer;
};

/**
 * 相対パス一覧から、指定レイヤーに属するリージョンタイル一覧を組み立てる。
 */
function buildRegionTiles({
  relativePaths,
  worldRootDir,
  layer,
}: BuildRegionTilesParams): RegionTileInput[] {
  const regionTiles: RegionTileInput[] = [];

  for (const relativePath of relativePaths) {
    const regionCoordinate = parseRegionTilePath(relativePath, layer);
    if (!regionCoordinate) {
      continue;
    }
    regionTiles.push({
      x: regionCoordinate.x,
      y: regionCoordinate.y,
      filePath: path.join(worldRootDir, relativePath),
    });
  }

  return regionTiles;
}

/**
 * waypoints/WaypointData.datが走査結果に含まれる場合のみ読み込み・変換して出力する。
 */
function writeWaypointsIfPresent({
  relativePaths,
  worldRootDir,
  outputRootDir,
}: {
  relativePaths: string[];
  worldRootDir: string;
  outputRootDir: string;
}): void {
  if (!relativePaths.includes(WAYPOINT_DATA_RELATIVE_PATH)) {
    return;
  }

  const waypointDataBuffer = fs.readFileSync(path.join(worldRootDir, WAYPOINT_DATA_RELATIVE_PATH));
  const convertedWaypoints = convertWaypointDataToJson(waypointDataBuffer);
  fs.writeFileSync(
    path.join(outputRootDir, WAYPOINT_JSON_FILE_NAME),
    JSON.stringify(convertedWaypoints),
  );
}

/**
 * journeyMapFileReader.readJourneyMapFilesが返す相対パス一覧を受け取り、
 * day/night/topo/biomeの各レイヤーをtileZoomPyramid.generateTileZoomPyramidへ、
 * waypointデータをwaypointConverter.convertWaypointDataToJsonへ、全レイヤー処理完了後に
 * tileMetadataWriter.writeTileMetadataへと束ねて委譲するオーケストレーション層(インフラ層)。
 */
export async function writeExportFiles({
  relativePaths,
  worldRootDir,
  outputRootDir,
  zMax,
}: WriteExportFilesParams): Promise<void> {
  const layerRegionTiles: Partial<Record<Layer, RegionTileInput[]>> = {};
  for (const layer of LAYERS) {
    const regionTiles = buildRegionTiles({ relativePaths, worldRootDir, layer });
    if (regionTiles.length > 0) {
      layerRegionTiles[layer] = regionTiles;
    }
  }

  const pyramidResults = await Promise.all(
    Object.entries(layerRegionTiles).map(([layer, regionTiles]) =>
      generateTileZoomPyramid({ layer, zMax, regionTiles, outputRootDir }),
    ),
  );

  writeWaypointsIfPresent({ relativePaths, worldRootDir, outputRootDir });

  const minZoom = Math.min(...pyramidResults.map((result) => result.minZoom));
  writeTileMetadata({ layerRegionTiles, zMax, minZoom, outputRootDir });
}
