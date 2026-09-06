import { describe, expect, test } from 'vitest';
import { createTileCoordinate } from '../TileCoordinate';

describe('createTileCoordinate', () => {
  test('zoom=0, x=0, y=0の境界値を渡したら生成できる', () => {
    // Act
    const result = createTileCoordinate({ zoom: 0, x: 0, y: 0 });

    // Assert
    expect(result).toBeDefined();
  });

  test('正のzoom/x/yを渡したら生成できる', () => {
    // Act
    const result = createTileCoordinate({ zoom: 3, x: 5, y: 7 });

    // Assert
    expect(result).toBeDefined();
  });

  test('負のx,yを渡したら生成できる', () => {
    // Act
    const result = createTileCoordinate({ zoom: 2, x: -4, y: -3 });

    // Assert
    expect(result).toBeDefined();
  });

  test('負のzoomを渡したらエラーを投げる', () => {
    // Act
    const act = () => createTileCoordinate({ zoom: -1, x: 0, y: 0 });

    // Assert
    expect(act).toThrow();
  });

  test.each([
    [{ zoom: 1.5, x: 0, y: 0 }],
    [{ zoom: 0, x: 1.5, y: 0 }],
    [{ zoom: 0, x: 0, y: 1.5 }],
  ])('非整数(小数)の値(%o)を渡したらエラーを投げる', (params) => {
    // Act
    const act = () => createTileCoordinate(params);

    // Assert
    expect(act).toThrow();
  });

  test.each([
    [{ zoom: NaN, x: 0, y: 0 }],
    [{ zoom: 0, x: NaN, y: 0 }],
    [{ zoom: 0, x: 0, y: NaN }],
    [{ zoom: Infinity, x: 0, y: 0 }],
    [{ zoom: 0, x: Infinity, y: 0 }],
    [{ zoom: 0, x: 0, y: Infinity }],
  ])('NaN/Infinityを含む値(%o)を渡したらエラーを投げる', (params) => {
    // Act
    const act = () => createTileCoordinate(params);

    // Assert
    expect(act).toThrow();
  });

  test('同じzoom/x/yを持つ2つのインスタンスを比較したら値として等しいと判定される', () => {
    // Arrange
    const a = createTileCoordinate({ zoom: 2, x: -1, y: 3 });
    const b = createTileCoordinate({ zoom: 2, x: -1, y: 3 });

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(true);
  });
});
