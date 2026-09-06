/** JourneyMapが生成するレイヤー種別(昼間/夜間/地形図)の一覧 */
export const LAYER_TYPES = ['day', 'night', 'topo'] as const;

export type LayerType = (typeof LAYER_TYPES)[number];

/** 値が定義済みのLayerTypeかどうかを判定する型ガード */
export const isLayerType = (value: unknown): value is LayerType =>
  typeof value === 'string' && (LAYER_TYPES as readonly string[]).includes(value);
