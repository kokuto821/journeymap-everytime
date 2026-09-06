import { createTileCoordinate } from '../../../coordinate/TileCoordinate';
import { createTile } from '../../Tile';

type CreateTileParams = Parameters<typeof createTile>[0];
type CreateTileCoordinateParams = Parameters<typeof createTileCoordinate>[0];

/**
 * テスト用にデフォルト値を持つTileを生成するヘルパー
 * 変更したいフィールドのみをoverridesで渡す
 */
export const createTestTile = (overrides: Partial<CreateTileParams> = {}): ReturnType<typeof createTile> =>
  createTile({
    dimension: 'overworld',
    layerType: 'day',
    tileCoordinate: createTestTileCoordinate(),
    ...overrides,
  });

/**
 * テスト用にデフォルト値を持つTileCoordinateを生成するヘルパー
 * 変更したいフィールドのみをoverridesで渡す
 */
export const createTestTileCoordinate = (
  overrides: Partial<CreateTileCoordinateParams> = {},
): ReturnType<typeof createTileCoordinate> =>
  createTileCoordinate({
    zoom: 1,
    x: 2,
    y: 3,
    ...overrides,
  });
