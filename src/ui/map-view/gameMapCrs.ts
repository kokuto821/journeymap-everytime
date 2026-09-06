import L from 'leaflet';

/**
 * JourneyMapのワールド座標(worldX/worldZ)を反転・オフセット無しでlatlngに対応させるカスタムCRS。
 * `L.CRS.Simple`標準の`transformation`(1, 0, -1, 0)はlatが増えると画面上方向に進む(北が上)が、
 * cを+1に反転し、Minecraftの+Z(南)が画面下方向に進むJourneyMapのタイル座標と一致させる
 * (design.md「JourneyMapタイル構造とWeb標準(XYZ)の互換性」参照)。
 * scaleはズームピラミッドの最大レベル`zMax`(ネイティブ解像度 = 1px/ブロック)を基準に、
 * 標準の`2^zoom`ではなく`2^(zoom - zMax)`とする。
 */
export function createGameMapCrs(zMax: number): L.CRS {
  return L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(1, 0, 1, 0),
    scale: (zoom: number) => Math.pow(2, zoom - zMax),
    zoom: (scale: number) => Math.log2(scale) + zMax,
  }) as L.CRS;
}
