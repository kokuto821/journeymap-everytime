import L from 'leaflet';
import { describe, expect, test } from 'vitest';
import { createGameMapCrs } from '../gameMapCrs';

const Z_MAX = 5;
const NATIVE_SCALE = 1;
const ONE_ZOOM_LEVEL_DOWN = 1;
const HALF_SCALE = 0.5;

describe('createGameMapCrs', () => {
  test('zMaxと同じズームレベルではscaleが1になる', () => {
    // Arrange
    const crs = createGameMapCrs(Z_MAX);

    // Act
    const result = crs.scale(Z_MAX);

    // Assert
    expect(result).toBe(NATIVE_SCALE);
  });

  test('zMaxから1ズームアウトするとscaleが半分になる', () => {
    // Arrange
    const crs = createGameMapCrs(Z_MAX);

    // Act
    const result = crs.scale(Z_MAX - ONE_ZOOM_LEVEL_DOWN);

    // Assert
    expect(result).toBe(HALF_SCALE);
  });

  test('scale(zMax)のズームレベルへ変換するとzMaxに戻る', () => {
    // Arrange
    const crs = createGameMapCrs(Z_MAX);

    // Act
    const result = crs.zoom(NATIVE_SCALE);

    // Assert
    expect(result).toBe(Z_MAX);
  });

  test('zMaxのズームレベルでworld座標(x, z)をlatLngへの反転・オフセット無しで相互変換する', () => {
    // Arrange
    const crs = createGameMapCrs(Z_MAX);
    const worldX = 120;
    const worldZ = -80;

    // Act
    const point = crs.latLngToPoint(L.latLng(worldZ, worldX), Z_MAX);

    // Assert
    expect(point.x).toBe(worldX);
    expect(point.y).toBe(worldZ);
  });

  test('zMaxのズームレベルでpointToLatLngがworld座標(x, z)にそのまま戻る', () => {
    // Arrange
    const crs = createGameMapCrs(Z_MAX);
    const worldX = 120;
    const worldZ = -80;

    // Act
    const latLng = crs.pointToLatLng(L.point(worldX, worldZ), Z_MAX);

    // Assert
    expect(latLng.lng).toBe(worldX);
    expect(latLng.lat).toBe(worldZ);
  });
});
