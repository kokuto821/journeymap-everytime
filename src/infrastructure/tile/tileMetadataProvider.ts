import type { LayerType } from '../../domain/layer/LayerType';

/** レイヤー1件分のタイル座標範囲(min/max)。scripts/export/infrastructure/tileMetadataWriter.tsの出力に対応する。 */
export type LayerTileRange = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

/** R2上のmetadata.jsonの内容。フロント側でmaxBounds・minZoom/maxZoomをハードコードせずに済ませるためのデータ。 */
export type TileMetadata = {
  zMax: number;
  minZoom: number;
  tileSize: number;
  layers: Partial<Record<LayerType, LayerTileRange>>;
};

/** R2ベースURLからmetadata.jsonを取得しパースして返す。取得に失敗した場合は例外を投げる。 */
export async function fetchTileMetadata(baseUrl: string): Promise<TileMetadata> {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const response = await fetch(`${normalizedBaseUrl}/metadata.json`);

  if (!response.ok) {
    throw new Error(`metadata.jsonの取得に失敗しました: ${response.status}`);
  }

  return (await response.json()) as TileMetadata;
}
