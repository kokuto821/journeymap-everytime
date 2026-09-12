import * as fs from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';

// 2×2隣接タイルを1枚に合成して半分サイズへ縮小する固定倍率(design.mdのF-004節で確定)。
const QUADRANT_GRID_SIZE = 2;
// 合成対象メンバー(実在する1〜4枚)のうち、代表としてメタデータ取得に使う先頭要素。
const FIRST_MEMBER_INDEX = 0;
// 縮小後サイズの下限(0px化によるsharpのエラーを避けるための最小値)。
const MIN_TILE_DIMENSION_PX = 1;
// 1段下のズームレベルとの差分。
const ONE_ZOOM_LEVEL_DOWN = 1;

/**
 * ネイティブ解像度(1px=1ブロック)のリージョンタイル1枚を表す入力。
 * `x`/`y`はJourneyMapのリージョン座標(符号付き整数)。
 */
export type RegionTileInput = {
  x: number;
  y: number;
  filePath: string;
};

export type GenerateTileZoomPyramidParams = {
  layer: string;
  zMax: number;
  regionTiles: RegionTileInput[];
  outputRootDir: string;
};

/** ズームレベル`z`上の1タイル(出力済みファイルを指す)。 */
type ZoomLevelTile = {
  x: number;
  y: number;
  filePath: string;
};

/**
 * `<outputRootDir>/tiles/<layer>/<z>/<x>,<y>.png`形式の出力ファイルパスを組み立てる。
 */
const buildTileFilePath = ({
  outputRootDir,
  layer,
  z,
  x,
  y,
}: {
  outputRootDir: string;
  layer: string;
  z: number;
  x: number;
  y: number;
}): string => path.join(outputRootDir, 'tiles', layer, String(z), `${x},${y}.png`);

/**
 * `filePath`の親ディレクトリが無ければ作成する。
 */
const ensureParentDirExists = (filePath: string): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

/**
 * 数値配列から重複を除いた昇順配列を作る(不動点判定での集合比較に使う)。
 */
const toSortedUniqueValues = (values: number[]): number[] =>
  Array.from(new Set(values)).sort((a, b) => a - b);

/**
 * 2つの(重複除去・整列済みの)数値配列が同じ集合を表しているかを判定する。
 */
const isSameValueSet = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * `tiles`のx/y座標集合が、1段下のズームレベルへの`floor(座標/2)`変換で
 * 不動点(集合として変化しない状態)に達しているかを判定する。
 */
const hasReachedFixedPoint = (tiles: ZoomLevelTile[]): boolean => {
  const currentXs = toSortedUniqueValues(tiles.map((tile) => tile.x));
  const currentYs = toSortedUniqueValues(tiles.map((tile) => tile.y));
  const nextXs = toSortedUniqueValues(currentXs.map((x) => Math.floor(x / QUADRANT_GRID_SIZE)));
  const nextYs = toSortedUniqueValues(currentYs.map((y) => Math.floor(y / QUADRANT_GRID_SIZE)));

  return isSameValueSet(currentXs, nextXs) && isSameValueSet(currentYs, nextYs);
};

/**
 * ネイティブ解像度のリージョンタイルを`zMax`レベルとして無変換コピーする。
 */
const copyAsNativeZoomLevel = ({
  regionTiles,
  outputRootDir,
  layer,
  zMax,
}: {
  regionTiles: RegionTileInput[];
  outputRootDir: string;
  layer: string;
  zMax: number;
}): ZoomLevelTile[] =>
  regionTiles.map(({ x, y, filePath }) => {
    const destPath = buildTileFilePath({ outputRootDir, layer, z: zMax, x, y });
    ensureParentDirExists(destPath);
    fs.copyFileSync(filePath, destPath);
    return { x, y, filePath: destPath };
  });

/** `groupByParentTileCoordinate`が返す、1つの親タイル座標に属するグループ。 */
type ParentTileGroup = {
  parentX: number;
  parentY: number;
  members: ZoomLevelTile[];
};

/**
 * 1ズームレベル分のタイルを、1段下(x2の解像度)の親タイル座標ごとにグルーピングする。
 * 4隅のうち実在するタイルのみが集まるため、4隅とも存在しない座標はグループとして現れない。
 */
const groupByParentTileCoordinate = (tiles: ZoomLevelTile[]): ParentTileGroup[] => {
  const groups = new Map<string, ParentTileGroup>();

  for (const tile of tiles) {
    const parentX = Math.floor(tile.x / QUADRANT_GRID_SIZE);
    const parentY = Math.floor(tile.y / QUADRANT_GRID_SIZE);
    const key = `${parentX},${parentY}`;
    const group = groups.get(key);
    if (group) {
      group.members.push(tile);
    } else {
      groups.set(key, { parentX, parentY, members: [tile] });
    }
  }

  return Array.from(groups.values());
};

/**
 * 2×2グループ(1〜4枚、欠けた象限は透過)を1枚に合成し、半分サイズに縮小して出力する。
 */
const composeQuadrantTile = async ({
  members,
  parentX,
  parentY,
  outputRootDir,
  layer,
  z,
}: {
  members: ZoomLevelTile[];
  parentX: number;
  parentY: number;
  outputRootDir: string;
  layer: string;
  z: number;
}): Promise<ZoomLevelTile> => {
  const { width, height } = await sharp(members[FIRST_MEMBER_INDEX].filePath).metadata();
  if (!width || !height) {
    throw new Error(`タイル画像のサイズを取得できません: ${members[FIRST_MEMBER_INDEX].filePath}`);
  }

  const compositeInputs = members.map((member) => ({
    input: member.filePath,
    left: (member.x - parentX * QUADRANT_GRID_SIZE) * width,
    top: (member.y - parentY * QUADRANT_GRID_SIZE) * height,
  }));

  const destPath = buildTileFilePath({ outputRootDir, layer, z, x: parentX, y: parentY });
  ensureParentDirExists(destPath);

  // 2×2タイル(元サイズの2倍角のキャンバス)を合成し、1段下のズームレベルでは
  // 元サイズの半分に縮小する(design.mdのF-004節で確定した縮小率)。
  // 合成(composite)と縮小(resize)を同一のsharpパイプラインに繋げると、
  // sharpが内部でresizeを合成前のベース画像に先行適用してしまい、
  // 縮小後のキャンバスより大きい合成対象画像を弾いてしまう(sharpの実装上の制約)。
  // そのため合成結果を一度バッファ化し、別のsharpインスタンスで縮小する。
  const composedBuffer = await sharp({
    create: {
      width: width * QUADRANT_GRID_SIZE,
      height: height * QUADRANT_GRID_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(compositeInputs)
    .png()
    .toBuffer();

  await sharp(composedBuffer)
    // 縮小時に補間で象限境界の色・透過度が滲まないよう最近傍法を使う。
    // 座標の不動点収束に必要な段数がタイルサイズの2進桁数を超えるケース
    // (座標がまばらに分布する等)でも0px化してsharpのエラーにならないよう、
    // 縮小後サイズは最低1pxを保証する。
    .resize(
      Math.max(MIN_TILE_DIMENSION_PX, Math.floor(width / QUADRANT_GRID_SIZE)),
      Math.max(MIN_TILE_DIMENSION_PX, Math.floor(height / QUADRANT_GRID_SIZE)),
      { kernel: 'nearest' },
    )
    .png()
    .toFile(destPath);

  return { x: parentX, y: parentY, filePath: destPath };
};

/**
 * 現在のズームレベルのタイル群から、1段下のズームレベルのタイル群を合成生成する。
 */
const composeNextZoomLevel = async ({
  currentLevelTiles,
  outputRootDir,
  layer,
  nextZ,
}: {
  currentLevelTiles: ZoomLevelTile[];
  outputRootDir: string;
  layer: string;
  nextZ: number;
}): Promise<ZoomLevelTile[]> => {
  const groups = groupByParentTileCoordinate(currentLevelTiles);

  return Promise.all(
    groups.map(({ parentX, parentY, members }) =>
      composeQuadrantTile({ members, parentX, parentY, outputRootDir, layer, z: nextZ }),
    ),
  );
};

/**
 * JourneyMapのネイティブ解像度リージョンタイルからWeb地図(Leaflet)向けの
 * ズームピラミッドを生成し、`<outputRootDir>/tiles/<layer>/<z>/<x>,<y>.png`
 * 形式でファイル出力する。
 *
 * ネイティブ解像度(1px=1ブロック)を最大ズーム`zMax`とし、2×2隣接タイルを
 * 半分サイズに縮小合成する処理を、x/y座標のユニーク値集合が`floor(x/2)`適用で
 * 不動点に達するまで再帰的に適用する(詳細は
 * openspec/changes/add-mvp-map-viewer/design.md のF-004節を参照)。
 */
export const generateTileZoomPyramid = async ({
  layer,
  zMax,
  regionTiles,
  outputRootDir,
}: GenerateTileZoomPyramidParams): Promise<{ minZoom: number }> => {
  let currentLevelTiles = copyAsNativeZoomLevel({ regionTiles, outputRootDir, layer, zMax });
  let currentZ = zMax;

  // zMax(ネイティブ解像度)は不動点判定の対象にせず、必ず1段下(zMax-1)まで生成する。
  // zMaxはピラミッドの起点であり、たまたま座標集合がfloor(x/2)で不変な分布(例:
  // タイルが1枚のみ)でも「既に最小ズームに到達した」とは扱わない。
  // そのため、まずzMax-1を無条件に生成し(do-whileの1回目)、以降は生成直後の
  // タイル群が不動点に達したかどうかで継続を判定する。
  do {
    const nextZ = currentZ - ONE_ZOOM_LEVEL_DOWN;
    currentLevelTiles = await composeNextZoomLevel({
      currentLevelTiles,
      outputRootDir,
      layer,
      nextZ,
    });
    currentZ = nextZ;
  } while (!hasReachedFixedPoint(currentLevelTiles));

  return { minZoom: currentZ };
};
