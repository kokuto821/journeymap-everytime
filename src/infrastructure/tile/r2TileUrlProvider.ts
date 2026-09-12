import type { LayerType } from '../../domain/layer/LayerType';

type BuildTileUrlTemplateParams = {
  /** タイル・metadata.jsonを配信するR2バケットのベースURL */
  baseUrl: string;
  /** 表示対象のレイヤー種別 */
  layerType: LayerType;
};

/**
 * R2ベースURLとLayerTypeから、Leafletの`L.tileLayer`にそのまま渡せるURLテンプレートを組み立てる。
 * 出力構造(`tiles/<layer>/<z>/<x>,<y>.png`)はscripts/export/infrastructure/tileZoomPyramid.tsの
 * 出力パスと対応させている。
 */
export const buildTileUrlTemplate = ({
  baseUrl,
  layerType,
}: BuildTileUrlTemplateParams): string => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  return `${normalizedBaseUrl}/tiles/${layerType}/{z}/{x},{y}.png`;
};
