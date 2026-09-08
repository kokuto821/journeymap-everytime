import type { TileMetadata } from '../../../../infrastructure/tile/tileMetadataProvider';

/** fetchTileMetadataの成功レスポンスを組み立てる。overridesで一部フィールドのみ変更できる。 */
export function createTileMetadata(overrides: Partial<TileMetadata> = {}): TileMetadata {
  return {
    zMax: 5,
    minZoom: 1,
    tileSize: 512,
    layers: {},
    ...overrides,
  };
}
