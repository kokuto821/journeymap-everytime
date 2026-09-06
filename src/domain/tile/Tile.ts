import type { Dimension } from '../world/Dimension';
import type { LayerType } from '../layer/LayerType';
import type { TileCoordinate } from '../coordinate/TileCoordinate';

export type Tile = {
  /** タイルが属するディメンション */
  readonly dimension: Dimension;
  /** タイルのレイヤー種別 */
  readonly layerType: LayerType;
  /** タイルの座標 */
  readonly tileCoordinate: TileCoordinate;
  /** 値として等しいかどうかを判定する */
  equals: (other: Tile) => boolean;
};

type CreateTileParams = {
  /** タイルが属するディメンション */
  dimension: Dimension;
  /** タイルのレイヤー種別 */
  layerType: LayerType;
  /** タイルの座標 */
  tileCoordinate: TileCoordinate;
};

/**
 * Tileを生成するファクトリ。
 * equalsはdimension/layerTypeの単純比較に加え、tileCoordinateの比較はTileCoordinate.equalsに委譲する。
 */
export const createTile = ({ dimension, layerType, tileCoordinate }: CreateTileParams): Tile => {
  return {
    dimension,
    layerType,
    tileCoordinate,
    equals: (other) => {
      const isSameTile =
        dimension === other.dimension &&
        layerType === other.layerType &&
        tileCoordinate.equals(other.tileCoordinate);
      return isSameTile;
    },
  };
};
