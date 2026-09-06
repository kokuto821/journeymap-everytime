import L from 'leaflet';
import { describe, expect, test } from 'vitest';
import { createGameMapCrs } from '../gameMapCrs';

describe('createGameMapCrs', () => {
  test('zMaxと同じズームレベルではscaleが1になる', () => {
    // Arrange
    const crs = createGameMapCrs(5);

    // Act
    const result = crs.scale(5);

    // Assert
    expect(result).toBe(1);
  });

  test('zMaxから1ズームアウトするとscaleが半分になる', () => {
    // Arrange
    const crs = createGameMapCrs(5);

    // Act
    const result = crs.scale(4);

    // Assert
    expect(result).toBe(0.5);
  });

  test('scale(zMax)のズームレベルへ変換するとzMaxに戻る', () => {
    // Arrange
    const crs = createGameMapCrs(5);

    // Act
    const result = crs.zoom(1);

    // Assert
    expect(result).toBe(5);
  });

  test('zMaxのズームレベルでworld座標(x, z)をlatLngへの反転・オフセット無しで相互変換する', () => {
    // Arrange
    const crs = createGameMapCrs(5);
    const worldX = 120;
    const worldZ = -80;

    // Act
    const point = crs.latLngToPoint(L.latLng(worldZ, worldX), 5);

    // Assert
    expect(point.x).toBe(worldX);
    expect(point.y).toBe(worldZ);
  });

  test('zMaxのズームレベルでpointToLatLngがworld座標(x, z)にそのまま戻る', () => {
    // Arrange
    const crs = createGameMapCrs(5);
    const worldX = 120;
    const worldZ = -80;

    // Act
    const latLng = crs.pointToLatLng(L.point(worldX, worldZ), 5);

    // Assert
    expect(latLng.lng).toBe(worldX);
    expect(latLng.lat).toBe(worldZ);
  });
});
