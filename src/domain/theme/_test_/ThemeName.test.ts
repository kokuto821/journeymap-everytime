import { describe, expect, test } from 'vitest';
import { DEFAULT_THEME_NAME, isThemeName, THEME_NAMES } from '../ThemeName';

describe('ThemeName', () => {
  test('THEME_NAMESを参照したらシンプルとレトロの2種類が得られる', () => {
    // Assert
    expect(THEME_NAMES).toEqual(['simple', 'retro']);
  });

  test('DEFAULT_THEME_NAMEを参照したらシンプルテーマが得られる', () => {
    // Assert
    expect(DEFAULT_THEME_NAME).toBe('simple');
  });

  test.each(THEME_NAMES)('定義済みのテーマ名(%s)を渡したらtrueを返す', (themeName) => {
    // Act
    const result = isThemeName(themeName);

    // Assert
    expect(result).toBe(true);
  });

  test.each([['dark'], [''], ['Simple']])('未定義の文字列(%o)を渡したらfalseを返す', (value) => {
    // Act
    const result = isThemeName(value);

    // Assert
    expect(result).toBe(false);
  });

  test.each([[undefined], [null], [0]])('文字列以外(%s)を渡したらfalseを返す', (value) => {
    // Act
    const result = isThemeName(value);

    // Assert
    expect(result).toBe(false);
  });
});
