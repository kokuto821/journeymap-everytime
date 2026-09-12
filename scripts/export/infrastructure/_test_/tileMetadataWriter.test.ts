import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { writeTileMetadata } from '../tileMetadataWriter.ts';
import type { RegionTileInput } from '../tileZoomPyramid.ts';

// writeTileMetadata(params: {
//   layerRegionTiles: Record<string, RegionTileInput[]>;
//   zMax: number;
//   minZoom: number;
//   outputRootDir: string;
// }): void
//
// 各レイヤー(day/night/topo/biome等)のリージョンタイル座標一覧・zMax・minZoomを受け取り、
// フロントエンドがL.tileLayerの設定(maxBounds/minZoom/maxZoom)に使うメタデータJSONを
// 組み立てて`<outputRootDir>/metadata.json`に出力する(インフラ層)。
// minZoom自体の計算(tileZoomPyramid.tsの不動点検出)はスコープ外で、呼び出し側が
// 計算済みの値を渡す前提とし、この関数はそのまま受け渡すのみ検証する。
//
// テストでは実際の一時ディレクトリ(fs.mkdtempSync)に出力させ、生成されたJSONファイルの
// 内容を読み込んで検証する(fsのモックは使わない)。

const TILE_SIZE = 512;
const METADATA_FILE_NAME = 'metadata.json';

/**
 * 座標のみを持つ`RegionTileInput`を組み立てる(このテストではファイルの実体は不要なため
 * `filePath`はダミー値で埋める)。
 */
const buildRegionTile = (x: number, y: number): RegionTileInput => ({
  x,
  y,
  filePath: `dummy/${x},${y}.png`,
});

/**
 * `outputRootDir`直下の`metadata.json`を読み込み、パースした内容を返す
 * (生成されたメタデータJSONの検証用ヘルパー)。
 */
const readMetadataJson = (outputRootDir: string): unknown => {
  const filePath = path.join(outputRootDir, METADATA_FILE_NAME);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

describe('writeTileMetadata', () => {
  let outputRootDir: string;

  beforeEach(() => {
    outputRootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tile-metadata-writer-test-'));
  });

  afterEach(() => {
    fs.rmSync(outputRootDir, { recursive: true, force: true });
  });

  test('単一レイヤー・複数座標を入力したらzMaxとmin/maxとタイルサイズを含むJSONファイルが生成される', () => {
    // Arrange
    const origin = { x: 0, y: 0 };
    const farCorner = { x: 2, y: 3 };
    const middle = { x: 1, y: 1 };
    const layerRegionTiles: Record<string, RegionTileInput[]> = {
      day: [
        buildRegionTile(origin.x, origin.y),
        buildRegionTile(farCorner.x, farCorner.y),
        buildRegionTile(middle.x, middle.y),
      ],
    };

    // Act
    writeTileMetadata({ layerRegionTiles, zMax: 4, minZoom: 0, outputRootDir });

    // Assert
    const metadata = readMetadataJson(outputRootDir);
    expect(metadata).toMatchObject({
      zMax: 4,
      tileSize: TILE_SIZE,
      layers: {
        day: { minX: 0, maxX: 2, minY: 0, maxY: 3 },
      },
    });
  });

  test('複数レイヤーそれぞれに異なる座標範囲を入力したらレイヤーごとに独立したmin/maxがJSONに含まれる', () => {
    // Arrange
    const dayNear = { x: 0, y: 0 };
    const dayFar = { x: 5, y: 5 };
    const nightNear = { x: 10, y: 10 };
    const nightFar = { x: 20, y: 20 };
    const layerRegionTiles: Record<string, RegionTileInput[]> = {
      day: [buildRegionTile(dayNear.x, dayNear.y), buildRegionTile(dayFar.x, dayFar.y)],
      night: [buildRegionTile(nightNear.x, nightNear.y), buildRegionTile(nightFar.x, nightFar.y)],
    };

    // Act
    writeTileMetadata({ layerRegionTiles, zMax: 4, minZoom: 0, outputRootDir });

    // Assert
    const metadata = readMetadataJson(outputRootDir);
    expect(metadata).toMatchObject({
      layers: {
        day: { minX: 0, maxX: 5, minY: 0, maxY: 5 },
        night: { minX: 10, maxX: 20, minY: 10, maxY: 20 },
      },
    });
  });

  test('負の座標を含む入力を渡したらmin/maxが数値としての大小関係で判定される', () => {
    // Arrange
    const southWest = { x: -4, y: -10 };
    const northEast = { x: 3, y: 2 };
    const west = { x: -1, y: 5 };
    const layerRegionTiles: Record<string, RegionTileInput[]> = {
      day: [
        buildRegionTile(southWest.x, southWest.y),
        buildRegionTile(northEast.x, northEast.y),
        buildRegionTile(west.x, west.y),
      ],
    };

    // Act
    writeTileMetadata({ layerRegionTiles, zMax: 4, minZoom: 0, outputRootDir });

    // Assert
    const metadata = readMetadataJson(outputRootDir);
    expect(metadata).toMatchObject({
      layers: {
        day: { minX: -4, maxX: 3, minY: -10, maxY: 5 },
      },
    });
  });

  test('minZoomを渡したら計算せずそのままJSONに含まれる', () => {
    // Arrange
    const origin = { x: 0, y: 0 };
    const layerRegionTiles: Record<string, RegionTileInput[]> = {
      day: [buildRegionTile(origin.x, origin.y)],
    };

    // Act
    writeTileMetadata({ layerRegionTiles, zMax: 6, minZoom: 2, outputRootDir });

    // Assert
    const metadata = readMetadataJson(outputRootDir);
    expect(metadata).toMatchObject({ minZoom: 2 });
  });

  test('リージョンタイルが1件のみのレイヤーだったらmin/maxがその1件の座標と一致する', () => {
    // Arrange
    const coordinate = { x: 7, y: -3 };
    const layerRegionTiles: Record<string, RegionTileInput[]> = {
      topo: [buildRegionTile(coordinate.x, coordinate.y)],
    };

    // Act
    writeTileMetadata({ layerRegionTiles, zMax: 4, minZoom: 0, outputRootDir });

    // Assert
    const metadata = readMetadataJson(outputRootDir);
    expect(metadata).toMatchObject({
      layers: {
        topo: { minX: 7, maxX: 7, minY: -3, maxY: -3 },
      },
    });
  });
});
