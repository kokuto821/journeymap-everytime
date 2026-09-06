import { describe, expect, test } from 'vitest';
import { createTestTile, createTestTileCoordinate } from './helpers/tileTestHelpers';

describe('Tile.equals', () => {
  test('全プロパティが同一な2つのTileを比較したらtrueを返す', () => {
    // Arrange
    const a = createTestTile();
    const b = createTestTile();

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(true);
  });

  test('Dimensionのみ異なる2つのTileを比較したらfalseを返す', () => {
    // Arrange
    const a = createTestTile();
    const b = createTestTile({ dimension: 'nether' as never });

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(false);
  });

  test('LayerTypeのみ異なる2つのTileを比較したらfalseを返す', () => {
    // Arrange
    const a = createTestTile();
    const b = createTestTile({ layerType: 'night' });

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(false);
  });

  test('TileCoordinateのzoomのみ異なる2つのTileを比較したらfalseを返す', () => {
    // Arrange
    const a = createTestTile();
    const b = createTestTile({ tileCoordinate: createTestTileCoordinate({ zoom: 2 }) });

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(false);
  });

  test('TileCoordinateのxのみ異なる2つのTileを比較したらfalseを返す', () => {
    // Arrange
    const a = createTestTile();
    const b = createTestTile({ tileCoordinate: createTestTileCoordinate({ x: 99 }) });

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(false);
  });

  test('TileCoordinateのyのみ異なる2つのTileを比較したらfalseを返す', () => {
    // Arrange
    const a = createTestTile();
    const b = createTestTile({ tileCoordinate: createTestTileCoordinate({ y: 99 }) });

    // Act
    const result = a.equals(b);

    // Assert
    expect(result).toBe(false);
  });

  test('自分自身と比較したらtrueを返す', () => {
    // Arrange
    const a = createTestTile();

    // Act
    const result = a.equals(a);

    // Assert
    expect(result).toBe(true);
  });

  test('a.equals(b)とb.equals(a)を比較したら結果が一致する', () => {
    // Arrange
    const a = createTestTile();
    const b = createTestTile({ layerType: 'night' });

    // Act
    const resultAB = a.equals(b);
    const resultBA = b.equals(a);

    // Assert
    expect(resultAB).toBe(resultBA);
  });
});
