/** UIテーマの識別子。アクセシビリティ配慮テーマは要件定義書9章の方針により持たない。 */
export const THEME_NAMES = ['simple', 'retro'] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

export const DEFAULT_THEME_NAME: ThemeName = 'simple';

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEME_NAMES as readonly string[]).includes(value);
}
