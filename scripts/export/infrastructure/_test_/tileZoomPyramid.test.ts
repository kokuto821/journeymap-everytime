import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { generateTileZoomPyramid, type RegionTileInput } from '../tileZoomPyramid.ts';

// generateTileZoomPyramid(params: {
//   layer: string;
//   zMax: number;
//   regionTiles: RegionTileInput[];
//   outputRootDir: string;
// }): Promise<void>
//
// JourneyMapのネイティブ解像度リージョンタイルからWeb地図(Leaflet)向けのズームピラミッドを
// 生成し、`<outputRootDir>/tiles/<layer>/<z>/<x>,<y>.png` 形式でファイル出力する
// (インフラ層、sharp使用)。合成ルール・座標変換・不動点による最小ズーム停止条件などの
// 契約詳細は openspec/changes/add-mvp-map-viewer/design.md のF-004節(209〜213行)を参照。
//
// テストではsharpで実際に小さなPNG画像(数px角)をテスト用の入力タイルとして一時ディレクトリに
// 配置し、実際に処理を実行してファイルシステム上の出力を検証する(fsやsharpのモックは使わない)。
// 破損PNG等の異常系入力への対応、再実行時の冪等性、大量ファイルでの負荷は別タスクのためスコープ外。

type RgbaColor = { r: number; g: number; b: number; alpha: number };

// 「不透明」を表す値は入力側(sharpのcreate optionsが0-1スケール)と
// 出力側(PNGピクセル値のaが0-255スケール)でスケールが異なる。
const ALPHA_OPAQUE_INPUT = 1;
const ALPHA_OPAQUE_OUTPUT = 255;
const ALPHA_TRANSPARENT_OUTPUT = 0;

const RED: RgbaColor = { r: 255, g: 0, b: 0, alpha: ALPHA_OPAQUE_INPUT };
const GREEN: RgbaColor = { r: 0, g: 255, b: 0, alpha: ALPHA_OPAQUE_INPUT };
const BLUE: RgbaColor = { r: 0, g: 0, b: 255, alpha: ALPHA_OPAQUE_INPUT };
const YELLOW: RgbaColor = { r: 255, g: 255, b: 0, alpha: ALPHA_OPAQUE_INPUT };

const DEFAULT_NATIVE_TILE_SIZE = 4;

// 1段下/2段下/3段下のズームレベルとの差分。
const ONE_ZOOM_LEVEL_DOWN = 1;
const TWO_ZOOM_LEVELS_DOWN = 2;
const THREE_ZOOM_LEVELS_DOWN = 3;
// 元サイズの半分に縮小されることの検証に使う除数。
const HALVING_DIVISOR = 2;

// 2×2グループの4象限を表す座標(左上/右上/左下/右下)。
const TOP_LEFT = { x: 0, y: 0 };
const TOP_RIGHT = { x: 1, y: 0 };
const BOTTOM_LEFT = { x: 0, y: 1 };
const BOTTOM_RIGHT = { x: 1, y: 1 };

// 複数リージョンタイルのうち代表(1枚目)を参照する際のインデックス。
const FIRST_REGION_TILE_INDEX = 0;

// 4×4(0〜3)のリージョンタイル分布に使う座標の上限インデックスと、その総数。
const MAX_GRID_INDEX = 3;
const EXPECTED_LEAF_TILE_COUNT = 16;

// 正負の境界をまたぐx座標分布(「座標変換の境界値」テスト用)。
const BOUNDARY_X_MINUS_2 = -2;
const BOUNDARY_X_MINUS_1 = -1;
const BOUNDARY_X_0 = 0;
const BOUNDARY_X_1 = 1;

// 不動点{-1, 0}へ収束するx座標分布(「不動点検出」「戻り値のminZoom」テスト用)。
const STRADDLING_X_MINUS_3 = -3;
const STRADDLING_X_MINUS_1 = -1;
const STRADDLING_X_0 = 0;
const STRADDLING_X_2 = 2;
const STRADDLING_XS = [STRADDLING_X_MINUS_3, STRADDLING_X_MINUS_1, STRADDLING_X_0, STRADDLING_X_2];

/**
 * `size`四方の単色PNG画像を`filePath`に生成する(テスト用の入力リージョンタイル)。
 */
const createSolidColorTile = async (
  filePath: string,
  size: number,
  color: RgbaColor,
): Promise<void> => {
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: color,
    },
  })
    .png()
    .toFile(filePath);
};

type RegionTileEntry = { x: number; y: number; color?: RgbaColor };

/**
 * `sourceDir`配下に`entries`で指定した座標・色(省略時はRED)の単色PNGタイルを生成し、
 * そのまま`generateTileZoomPyramid`へ渡せる`RegionTileInput`の配列として返す
 * (テスト用の入力リージョンタイル一括準備ヘルパー)。
 */
const arrangeRegionTiles = async (
  sourceDir: string,
  entries: RegionTileEntry[],
): Promise<RegionTileInput[]> =>
  Promise.all(
    entries.map(async ({ x, y, color = RED }) => {
      const filePath = path.join(sourceDir, `${x},${y}.png`);
      await createSolidColorTile(filePath, DEFAULT_NATIVE_TILE_SIZE, color);
      return { x, y, filePath };
    }),
  );

/**
 * `generateTileZoomPyramid`が出力するタイルファイルパス
 * (`<outputRootDir>/tiles/<layer>/<z>/<x>,<y>.png`)を組み立てる。
 */
const expectedTilePath = (
  outputRootDir: string,
  layer: string,
  z: number,
  x: number,
  y: number,
): string => path.join(outputRootDir, 'tiles', layer, String(z), `${x},${y}.png`);

type RawImage = { data: Buffer; width: number; height: number; channels: number };

/**
 * PNG画像を生のRGBAピクセル値(アルファチャンネル込み)として読み込む。
 */
const readRawPixels = async (filePath: string): Promise<RawImage> => {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
};

/**
 * `readRawPixels`の結果から、座標(x, y)のピクセル値をRGBAで取得する。
 */
const GREEN_CHANNEL_OFFSET = 1;
const BLUE_CHANNEL_OFFSET = 2;
const ALPHA_CHANNEL_OFFSET = 3;

const getPixel = (
  raw: RawImage,
  x: number,
  y: number,
): { r: number; g: number; b: number; a: number } => {
  const offset = (y * raw.width + x) * raw.channels;
  return {
    r: raw.data[offset],
    g: raw.data[offset + GREEN_CHANNEL_OFFSET],
    b: raw.data[offset + BLUE_CHANNEL_OFFSET],
    a: raw.data[offset + ALPHA_CHANNEL_OFFSET],
  };
};

describe('generateTileZoomPyramid', () => {
  let tmpRootDir: string;
  let sourceDir: string;
  let outputRootDir: string;

  beforeEach(() => {
    tmpRootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tile-zoom-pyramid-'));
    sourceDir = path.join(tmpRootDir, 'source');
    outputRootDir = path.join(tmpRootDir, 'output');
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(outputRootDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpRootDir, { recursive: true, force: true });
  });

  describe('基本の合成', () => {
    test('2×2グループの4リージョンタイルが揃っていたら合成後のタイルサイズが元の半分になる', async () => {
      // Arrange
      const zMax = 5;
      const layer = 'day';
      const regionTiles = await arrangeRegionTiles(sourceDir, [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ]);

      // Act
      await generateTileZoomPyramid({ layer, zMax, regionTiles, outputRootDir });

      // Assert
      const composedPath = expectedTilePath(
        outputRootDir,
        layer,
        zMax - ONE_ZOOM_LEVEL_DOWN,
        TOP_LEFT.x,
        TOP_LEFT.y,
      );
      const metadata = await sharp(composedPath).metadata();
      expect(metadata.width).toBe(DEFAULT_NATIVE_TILE_SIZE / HALVING_DIVISOR);
      expect(metadata.height).toBe(DEFAULT_NATIVE_TILE_SIZE / HALVING_DIVISOR);
    });
  });

  describe('象限マッピング', () => {
    test('4隅を判別可能な色分けタイルを合成したら各象限に元の色が配置される', async () => {
      // Arrange
      const zMax = 5;
      const layer = 'day';
      const regionTiles = await arrangeRegionTiles(sourceDir, [
        { x: 0, y: 0, color: RED },
        { x: 1, y: 0, color: GREEN },
        { x: 0, y: 1, color: BLUE },
        { x: 1, y: 1, color: YELLOW },
      ]);

      // Act
      await generateTileZoomPyramid({ layer, zMax, regionTiles, outputRootDir });

      // Assert
      const composedPath = expectedTilePath(
        outputRootDir,
        layer,
        zMax - ONE_ZOOM_LEVEL_DOWN,
        TOP_LEFT.x,
        TOP_LEFT.y,
      );
      const raw = await readRawPixels(composedPath);
      expect(getPixel(raw, TOP_LEFT.x, TOP_LEFT.y)).toEqual({
        r: 255,
        g: 0,
        b: 0,
        a: ALPHA_OPAQUE_OUTPUT,
      });
      expect(getPixel(raw, TOP_RIGHT.x, TOP_RIGHT.y)).toEqual({
        r: 0,
        g: 255,
        b: 0,
        a: ALPHA_OPAQUE_OUTPUT,
      });
      expect(getPixel(raw, BOTTOM_LEFT.x, BOTTOM_LEFT.y)).toEqual({
        r: 0,
        g: 0,
        b: 255,
        a: ALPHA_OPAQUE_OUTPUT,
      });
      expect(getPixel(raw, BOTTOM_RIGHT.x, BOTTOM_RIGHT.y)).toEqual({
        r: 255,
        g: 255,
        b: 0,
        a: ALPHA_OPAQUE_OUTPUT,
      });
    });
  });

  describe('単一タイルのコピー', () => {
    test('リージョンタイルが1枚のみだったらzMaxのタイルは無変換でコピーされる', async () => {
      // Arrange
      const zMax = 5;
      const layer = 'day';
      const regionTiles = await arrangeRegionTiles(sourceDir, [{ x: 0, y: 0, color: RED }]);
      const sourceFilePath = regionTiles[FIRST_REGION_TILE_INDEX].filePath;

      // Act
      await generateTileZoomPyramid({ layer, zMax, regionTiles, outputRootDir });

      // Assert
      const copiedPath = expectedTilePath(outputRootDir, layer, zMax, TOP_LEFT.x, TOP_LEFT.y);
      const [sourceRaw, copiedRaw] = await Promise.all([
        readRawPixels(sourceFilePath),
        readRawPixels(copiedPath),
      ]);
      expect(copiedRaw.width).toBe(sourceRaw.width);
      expect(copiedRaw.height).toBe(sourceRaw.height);
      expect(copiedRaw.data).toEqual(sourceRaw.data);
    });
  });

  describe('対角2枚のみ存在', () => {
    test('対角2枚のみ存在したら合成後のタイルは元の位置に対応する2箇所のみ不透明になる', async () => {
      // Arrange
      const zMax = 5;
      const layer = 'day';
      const regionTiles = await arrangeRegionTiles(sourceDir, [
        { x: 0, y: 0, color: RED },
        { x: 1, y: 1, color: YELLOW },
      ]);

      // Act
      await generateTileZoomPyramid({ layer, zMax, regionTiles, outputRootDir });

      // Assert
      const composedPath = expectedTilePath(
        outputRootDir,
        layer,
        zMax - ONE_ZOOM_LEVEL_DOWN,
        TOP_LEFT.x,
        TOP_LEFT.y,
      );
      const raw = await readRawPixels(composedPath);
      expect(getPixel(raw, TOP_LEFT.x, TOP_LEFT.y)).toEqual({
        r: 255,
        g: 0,
        b: 0,
        a: ALPHA_OPAQUE_OUTPUT,
      });
      expect(getPixel(raw, BOTTOM_RIGHT.x, BOTTOM_RIGHT.y)).toEqual({
        r: 255,
        g: 255,
        b: 0,
        a: ALPHA_OPAQUE_OUTPUT,
      });
      expect(getPixel(raw, TOP_RIGHT.x, TOP_RIGHT.y).a).toBe(ALPHA_TRANSPARENT_OUTPUT);
      expect(getPixel(raw, BOTTOM_LEFT.x, BOTTOM_LEFT.y).a).toBe(ALPHA_TRANSPARENT_OUTPUT);
    });
  });

  describe('1枚のみ存在', () => {
    test('2×2グループのうち1枚のみ存在したら合成後のタイルは元の位置に対応する1箇所のみ不透明になる', async () => {
      // Arrange
      const zMax = 5;
      const layer = 'day';
      const regionTiles = await arrangeRegionTiles(sourceDir, [{ x: 0, y: 0, color: RED }]);

      // Act
      await generateTileZoomPyramid({ layer, zMax, regionTiles, outputRootDir });

      // Assert
      const composedPath = expectedTilePath(
        outputRootDir,
        layer,
        zMax - ONE_ZOOM_LEVEL_DOWN,
        TOP_LEFT.x,
        TOP_LEFT.y,
      );
      const raw = await readRawPixels(composedPath);
      expect(getPixel(raw, TOP_LEFT.x, TOP_LEFT.y)).toEqual({
        r: 255,
        g: 0,
        b: 0,
        a: ALPHA_OPAQUE_OUTPUT,
      });
      expect(getPixel(raw, TOP_RIGHT.x, TOP_RIGHT.y).a).toBe(ALPHA_TRANSPARENT_OUTPUT);
      expect(getPixel(raw, BOTTOM_LEFT.x, BOTTOM_LEFT.y).a).toBe(ALPHA_TRANSPARENT_OUTPUT);
      expect(getPixel(raw, BOTTOM_RIGHT.x, BOTTOM_RIGHT.y).a).toBe(ALPHA_TRANSPARENT_OUTPUT);
    });
  });

  describe('4枚とも存在しない場合はスキップ', () => {
    test('2×2グループの4隅がいずれも存在しない場合はそのグループのタイルファイルが生成されない', async () => {
      // Arrange
      const zMax = 5;
      const layer = 'day';
      const farRegionTileX = 4;
      const regionTiles = await arrangeRegionTiles(sourceDir, [
        { x: 0, y: 0, color: RED },
        { x: farRegionTileX, y: 0, color: GREEN },
      ]);
      const missingGroup = { x: 1, y: 0 };
      const secondGroup = { x: 2, y: 0 };

      // Act
      await generateTileZoomPyramid({ layer, zMax, regionTiles, outputRootDir });

      // Assert: 間に挟まる、4隅とも未探索のグループ(1,0)は生成されない
      const parentZoom = zMax - ONE_ZOOM_LEVEL_DOWN;
      expect(
        fs.existsSync(
          expectedTilePath(outputRootDir, layer, parentZoom, missingGroup.x, missingGroup.y),
        ),
      ).toBe(false);
      expect(
        fs.existsSync(expectedTilePath(outputRootDir, layer, parentZoom, TOP_LEFT.x, TOP_LEFT.y)),
      ).toBe(true);
      expect(
        fs.existsSync(
          expectedTilePath(outputRootDir, layer, parentZoom, secondGroup.x, secondGroup.y),
        ),
      ).toBe(true);
    });
  });

  describe('座標変換の境界値', () => {
    test('境界をまたぐ負のx座標を入力したらz-1変換でfloor(x/2)の結果になる', async () => {
      // Arrange
      const zMax = 5;
      const layer = 'day';
      const xs = [BOUNDARY_X_MINUS_2, BOUNDARY_X_MINUS_1, BOUNDARY_X_0, BOUNDARY_X_1];
      const regionTiles = await arrangeRegionTiles(
        sourceDir,
        xs.map((x) => ({ x, y: 0 })),
      );

      // Act
      await generateTileZoomPyramid({ layer, zMax, regionTiles, outputRootDir });

      // Assert: floor(-2/2)=floor(-1/2)=-1、floor(0/2)=floor(1/2)=0
      const parentZoom = zMax - ONE_ZOOM_LEVEL_DOWN;
      expect(
        fs.existsSync(
          expectedTilePath(outputRootDir, layer, parentZoom, BOUNDARY_X_MINUS_1, BOUNDARY_X_0),
        ),
      ).toBe(true);
      expect(
        fs.existsSync(
          expectedTilePath(outputRootDir, layer, parentZoom, BOUNDARY_X_0, BOUNDARY_X_0),
        ),
      ).toBe(true);
    });
  });

  describe('不動点検出による停止', () => {
    test('正負をまたぐ座標分布を入力したら不動点で再帰が停止し完了する', async () => {
      // Arrange
      const zMax = 5;
      const layer = 'day';
      const xs = STRADDLING_XS;
      const regionTiles = await arrangeRegionTiles(
        sourceDir,
        xs.map((x) => ({ x, y: 0 })),
      );

      // Act: 無限ループに陥る実装であればここでタイムアウトし、テストが失敗する
      await generateTileZoomPyramid({ layer, zMax, regionTiles, outputRootDir });

      // Assert: x座標のユニーク値集合はfloor(x/2)を繰り返すと{-1, 0}で不動点に達し、
      // その時点で複数タイル(1枚とは限らない)を残して再帰が停止している
      const layerDir = path.join(outputRootDir, 'tiles', layer);
      const zoomLevels = fs.readdirSync(layerDir).map(Number);
      const minZoomLevel = Math.min(...zoomLevels);
      const minZoomFiles = fs.readdirSync(path.join(layerDir, String(minZoomLevel)));
      expect(minZoomFiles.sort()).toEqual(['-1,0.png', '0,0.png']);
    });
  });

  describe('多段再帰', () => {
    test('十分な分布のリージョンタイルを入力するとzMaxからzMax-2まで3段階のズームレベルが生成される', async () => {
      // Arrange
      const zMax = 5;
      const layer = 'day';
      const entries: RegionTileEntry[] = [];
      for (let x = 0; x <= MAX_GRID_INDEX; x++) {
        for (let y = 0; y <= MAX_GRID_INDEX; y++) {
          entries.push({ x, y });
        }
      }
      const regionTiles = await arrangeRegionTiles(sourceDir, entries);

      // Act
      await generateTileZoomPyramid({ layer, zMax, regionTiles, outputRootDir });

      // Assert
      const layerDir = path.join(outputRootDir, 'tiles', layer);
      const zMaxFiles = fs.readdirSync(path.join(layerDir, String(zMax)));
      const zMaxMinus1Files = fs.readdirSync(
        path.join(layerDir, String(zMax - ONE_ZOOM_LEVEL_DOWN)),
      );
      const zMaxMinus2Files = fs.readdirSync(
        path.join(layerDir, String(zMax - TWO_ZOOM_LEVELS_DOWN)),
      );

      expect(zMaxFiles).toHaveLength(EXPECTED_LEAF_TILE_COUNT);
      expect(zMaxMinus1Files.slice().sort()).toEqual(
        ['0,0.png', '1,0.png', '0,1.png', '1,1.png'].sort(),
      );
      expect(zMaxMinus2Files).toEqual(['0,0.png']);
      expect(fs.existsSync(path.join(layerDir, String(zMax - THREE_ZOOM_LEVELS_DOWN)))).toBe(false);
    });
  });

  describe('戻り値のminZoom', () => {
    test('リージョンタイルが1枚のみだったらminZoomがzMax-1になる', async () => {
      // Arrange: zMaxは不動点判定の対象外で必ず1段(zMax-1)は生成されるため、
      // 1枚のみの入力でもminZoomはzMax自体ではなくzMax-1になる想定。
      const zMax = 5;
      const layer = 'day';
      const regionTiles = await arrangeRegionTiles(sourceDir, [{ x: 0, y: 0, color: RED }]);

      // Act
      const result = await generateTileZoomPyramid({ layer, zMax, regionTiles, outputRootDir });

      // Assert
      expect(result.minZoom).toBe(zMax - ONE_ZOOM_LEVEL_DOWN);
    });

    test('正負をまたぐ座標分布を入力したら不動点へ到達したズームレベルがminZoomになる', async () => {
      // Arrange: 「不動点検出による停止」テストと同じ座標分布。
      // x座標のユニーク値集合はfloor(x/2)をzMax→zMax-1→zMax-2と2回適用した時点
      // ({-1, 0})で不動点に達するため、minZoomはzMax-2(=3)になる想定。
      const zMax = 5;
      const layer = 'day';
      const xs = STRADDLING_XS;
      const regionTiles = await arrangeRegionTiles(
        sourceDir,
        xs.map((x) => ({ x, y: 0 })),
      );

      // Act
      const result = await generateTileZoomPyramid({ layer, zMax, regionTiles, outputRootDir });

      // Assert
      expect(result.minZoom).toBe(zMax - TWO_ZOOM_LEVELS_DOWN);
    });
  });

  describe('出力パス形式', () => {
    test('リージョンタイルを入力したら出力ファイルパスがtiles/<layer>/<z>/<x>,<y>.png形式になる', async () => {
      // Arrange
      const zMax = 7;
      const layer = 'night';
      const regionTileX = -4;
      const regionTileY = 3;
      const regionTiles = await arrangeRegionTiles(sourceDir, [
        { x: regionTileX, y: regionTileY, color: RED },
      ]);

      // Act
      await generateTileZoomPyramid({ layer, zMax, regionTiles, outputRootDir });

      // Assert
      const expectedPath = expectedTilePath(outputRootDir, layer, zMax, regionTileX, regionTileY);
      expect(fs.existsSync(expectedPath)).toBe(true);
    });
  });
});
