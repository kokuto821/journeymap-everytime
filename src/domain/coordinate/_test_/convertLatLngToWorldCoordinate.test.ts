import L from 'leaflet';
import { describe, expect, test } from 'vitest';
import { convertLatLngToWorldCoordinate } from '../convertLatLngToWorldCoordinate';

describe('convertLatLngToWorldCoordinate', () => {
  test('lat=0, lng=0を変換したらx=0, z=0になる', () => {
    // Arrange
    const latlng = L.latLng(0, 0);

    // Act
    const result = convertLatLngToWorldCoordinate(latlng, 0);

    // Assert
    expect(result.x).toBe(0);
    expect(result.z).toBe(0);
  });

  test('正のlat/lngを変換したら対応する正のx/zになる', () => {
    // Arrange
    const latlng = L.latLng(10, 20);

    // Act
    const result = convertLatLngToWorldCoordinate(latlng, 0);

    // Assert
    expect(result.x).toBe(20);
    expect(result.z).toBe(10);
  });

  test('負のlat/lngを変換したら対応する負のx/zになる', () => {
    // Arrange
    const latlng = L.latLng(-10, -20);

    // Act
    const result = convertLatLngToWorldCoordinate(latlng, 0);

    // Assert
    expect(result.x).toBe(-20);
    expect(result.z).toBe(-10);
  });

  test('小数点を含むlat/lngを変換したら整数に切り捨てられる', () => {
    // Arrange
    const latlng = L.latLng(10.9, 20.1);

    // Act
    const result = convertLatLngToWorldCoordinate(latlng, 0);

    // Assert
    expect(result.x).toBe(20);
    expect(result.z).toBe(10);
  });

  test('異なるzoom値を渡しても変換結果が変わらない', () => {
    // Arrange
    const latlng = L.latLng(10, 20);

    // Act
    const resultAtZoomZero = convertLatLngToWorldCoordinate(latlng, 0);
    const resultAtZoomFour = convertLatLngToWorldCoordinate(latlng, 4);

    // Assert
    expect(resultAtZoomFour.x).toBe(resultAtZoomZero.x);
    expect(resultAtZoomFour.z).toBe(resultAtZoomZero.z);
  });
});
