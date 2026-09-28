export type WorldCoordinate = {
  /** ワールドX座標(符号付き整数) */
  readonly x: number;
  /** ワールドZ座標(符号付き整数) */
  readonly z: number;
  /** 値として等しいかどうかを判定する */
  equals: (other: WorldCoordinate) => boolean;
};

type CreateWorldCoordinateParams = {
  /** ワールドX座標(符号付き整数) */
  x: number;
  /** ワールドZ座標(符号付き整数) */
  z: number;
};

/**
 * WorldCoordinateを生成するファクトリ。
 * x/zは整数であることを検証し、不正な値はErrorをthrowする。
 */
export const createWorldCoordinate = ({ x, z }: CreateWorldCoordinateParams): WorldCoordinate => {
  if (!Number.isInteger(x)) {
    throw new Error(`xは整数である必要があります: ${x}`);
  }
  if (!Number.isInteger(z)) {
    throw new Error(`zは整数である必要があります: ${z}`);
  }

  return {
    x,
    z,
    equals: (other) => {
      const isSameCoordinate = x === other.x && z === other.z;
      return isSameCoordinate;
    },
  };
};
