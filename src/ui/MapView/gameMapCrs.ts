import L from 'leaflet';

// 反転・オフセット無しの変換係数(a, b, c, d)。cを+1に反転し、Minecraftの+Z(南)が
// 画面下方向に進むJourneyMapのタイル座標と一致させる(L.CRS.Simple標準の(1, 0, -1, 0)との差分)。
const TRANSFORM_SCALE_X = 1;
const TRANSFORM_OFFSET_X = 0;
const TRANSFORM_SCALE_Y = 1;
const TRANSFORM_OFFSET_Y = 0;
// scale/zoomの底。標準の`2^zoom`ではなく`2^(zoom - zMax)`とする際にも使う。
const ZOOM_SCALE_BASE = 2;

/**
 * JourneyMapのワールド座標(worldX/worldZ)を反転・オフセット無しでlatlngに対応させるカスタムCRS。
 * `L.CRS.Simple`標準の`transformation`(1, 0, -1, 0)はlatが増えると画面上方向に進む(北が上)が、
 * cを+1に反転し、Minecraftの+Z(南)が画面下方向に進むJourneyMapのタイル座標と一致させる
 * (design.md「JourneyMapタイル構造とWeb標準(XYZ)の互換性」参照)。
 * scaleはズームピラミッドの最大レベル`zMax`(ネイティブ解像度 = 1px/ブロック)を基準に、
 * 標準の`2^zoom`ではなく`2^(zoom - zMax)`とする。
 */
export const createGameMapCrs = (zMax: number): L.CRS =>
  L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(
      TRANSFORM_SCALE_X,
      TRANSFORM_OFFSET_X,
      TRANSFORM_SCALE_Y,
      TRANSFORM_OFFSET_Y,
    ),
    scale: (zoom: number) => Math.pow(ZOOM_SCALE_BASE, zoom - zMax),
    zoom: (scale: number) => Math.log2(scale) + zMax,
  }) as L.CRS;
