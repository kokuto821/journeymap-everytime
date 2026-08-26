import { describe, expect, test } from 'vitest';
import { DEFAULT_THEME_NAME, isThemeName, THEME_NAMES } from './ThemeName';

describe('ThemeName', () => {
  test('シンプルテーマとレトロゲームテーマの2種類を持つ', () => {
    expect(THEME_NAMES).toEqual(['simple', 'retro']);
  });

  test('既定はシンプルテーマ', () => {
    expect(DEFAULT_THEME_NAME).toBe('simple');
  });

  test.each(THEME_NAMES)('%s を妥当なテーマ名と判定する', (name) => {
    expect(isThemeName(name)).toBe(true);
  });

  test.each([['dark'], [''], ['Simple']])('%o を妥当なテーマ名と判定しない', (value) => {
    expect(isThemeName(value)).toBe(false);
  });

  test('文字列以外を妥当なテーマ名と判定しない', () => {
    expect(isThemeName(undefined)).toBe(false);
    expect(isThemeName(null)).toBe(false);
    expect(isThemeName(0)).toBe(false);
  });
});
