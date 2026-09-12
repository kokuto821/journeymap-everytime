import { useMemo } from 'react';
import type { LayerType } from '../../domain/layer/LayerType';
import { getR2BaseUrl } from '../../infrastructure/config/env';
import { buildTileUrlTemplate } from '../../infrastructure/tile/r2TileUrlProvider';

/** 指定したLayerTypeに対応するLeaflet用タイルURLテンプレートを返す。 */
export const useTileLayerUrl = (layerType: LayerType): string =>
  useMemo(() => buildTileUrlTemplate({ baseUrl: getR2BaseUrl(), layerType }), [layerType]);
