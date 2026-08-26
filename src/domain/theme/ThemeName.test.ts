import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME_NAME, isThemeName, THEME_NAMES } from './ThemeName';

describe('ThemeName', () => {
  it('シンプルテーマとレトロゲームテーマの2種類を持つ', () => {
    expect(THEME_NAMES).toEqual(['simple', 'retro']);
  });

  it('既定はシンプルテーマ', () => {
    expect(DEFAULT_THEME_NAME).toBe('simple');
  });

  it.each(THEME_NAMES)('%s を妥当なテーマ名と判定する', (name) => {
    expect(isThemeName(name)).toBe(true);
  });

  it.each([['dark'], [''], ['Simple']])('%o を妥当なテーマ名と判定しない', (value) => {
    expect(isThemeName(value)).toBe(false);
  });

  it('文字列以外を妥当なテーマ名と判定しない', () => {
    expect(isThemeName(undefined)).toBe(false);
    expect(isThemeName(null)).toBe(false);
    expect(isThemeName(0)).toBe(false);
  });
});
