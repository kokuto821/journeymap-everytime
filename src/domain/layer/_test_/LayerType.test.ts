import { describe, expect, test } from 'vitest';
import { isLayerType } from '../LayerType';

describe('isLayerType', () => {
  test.each([['day'], ['night'], ['topo']])(
    '定義済みのレイヤー種別(%s)を渡したらtrueを返す',
    (value) => {
      // Act
      const result = isLayerType(value);

      // Assert
      expect(result).toBe(true);
    },
  );

  test('未定義の文字列を渡したらfalseを返す', () => {
    // Act
    const result = isLayerType('foo');

    // Assert
    expect(result).toBe(false);
  });

  test('空文字を渡したらfalseを返す', () => {
    // Act
    const result = isLayerType('');

    // Assert
    expect(result).toBe(false);
  });

  test.each([[null], [undefined], [0], [{}], [[]]])(
    '文字列以外(%o)を渡したらfalseを返す',
    (value) => {
      // Act
      const result = isLayerType(value);

      // Assert
      expect(result).toBe(false);
    },
  );

  test('大文字小文字が異なる文字列(Day)を渡したらfalseを返す', () => {
    // Act
    const result = isLayerType('Day');

    // Assert
    expect(result).toBe(false);
  });

  test('前後に空白を含む文字列( day)を渡したらfalseを返す', () => {
    // Act
    const result = isLayerType(' day');

    // Assert
    expect(result).toBe(false);
  });
});
