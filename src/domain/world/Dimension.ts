/**
 * ワールドのディメンション一覧。
 * MVP時点ではoverworldのみ対応。nether/the_endは将来拡張候補(v1.1以降)。
 */
export const DIMENSIONS = ['overworld'] as const;

export type Dimension = (typeof DIMENSIONS)[number];

/** 値が定義済みのDimensionかどうかを判定する型ガード */
export const isDimension = (value: unknown): value is Dimension =>
  typeof value === 'string' && (DIMENSIONS as readonly string[]).includes(value);
