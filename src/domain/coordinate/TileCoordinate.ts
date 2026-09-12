export type TileCoordinate = {
  /** ズームレベル(0以上の整数) */
  readonly zoom: number;
  /** タイルのX座標(符号付き整数) */
  readonly x: number;
  /** タイルのY座標(符号付き整数) */
  readonly y: number;
  /** 値として等しいかどうかを判定する */
  equals: (other: TileCoordinate) => boolean;
};

type CreateTileCoordinateParams = {
  /** ズームレベル(0以上の整数) */
  zoom: number;
  /** タイルのX座標(符号付き整数) */
  x: number;
  /** タイルのY座標(符号付き整数) */
  y: number;
};

const MIN_ZOOM = 0;

const isValidZoom = (value: number): boolean => Number.isInteger(value) && value >= MIN_ZOOM;

/**
 * TileCoordinateを生成するファクトリ。
 * zoomは0以上の整数、x/yは整数であることを検証し、不正な値はErrorをthrowする。
 */
export const createTileCoordinate = ({
  zoom,
  x,
  y,
}: CreateTileCoordinateParams): TileCoordinate => {
  if (!isValidZoom(zoom)) {
    throw new Error(`zoomは0以上の整数である必要があります: ${zoom}`);
  }
  if (!Number.isInteger(x)) {
    throw new Error(`xは整数である必要があります: ${x}`);
  }
  if (!Number.isInteger(y)) {
    throw new Error(`yは整数である必要があります: ${y}`);
  }

  return {
    zoom,
    x,
    y,
    equals: (other) => {
      const isSameCoordinate = zoom === other.zoom && x === other.x && y === other.y;
      return isSameCoordinate;
    },
  };
};
