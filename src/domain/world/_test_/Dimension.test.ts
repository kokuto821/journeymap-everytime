import { describe, expect, test } from 'vitest';
import { isDimension } from '../Dimension';

describe('isDimension', () => {
  test('定義済みのディメンション(overworld)を渡したらtrueを返す', () => {
    // Act
    const result = isDimension('overworld');

    // Assert
    expect(result).toBe(true);
  });

  test('未知の文字列を渡したらfalseを返す', () => {
    // Act
    const result = isDimension('unknown');

    // Assert
    expect(result).toBe(false);
  });

  test('空文字を渡したらfalseを返す', () => {
    // Act
    const result = isDimension('');

    // Assert
    expect(result).toBe(false);
  });

  const NUMBER_VALUE = 0;

  test.each([[null], [undefined], [NUMBER_VALUE], [{}], [[]]])(
    '文字列以外(%o)を渡したらfalseを返す',
    (value) => {
      // Act
      const result = isDimension(value);

      // Assert
      expect(result).toBe(false);
    },
  );

  test.each([['nether'], ['the_end']])(
    '将来拡張候補だが現状は未対応の文字列(%s)を渡したらfalseを返す',
    (value) => {
      // Act
      const result = isDimension(value);

      // Assert
      expect(result).toBe(false);
    },
  );
});
