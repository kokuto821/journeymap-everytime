import L from 'leaflet';
import { describe, expect, test } from 'vitest';
import { convertLatLngToWorldCoordinate } from '../convertLatLngToWorldCoordinate';

describe('convertLatLngToWorldCoordinate', () => {
  test('lat=0, lng=0を変換したらx=0, z=0になる', () => {
    // Arrange
    const lat = 0;
    const lng = 0;
    const expectedX = 0;
    const expectedZ = 0;
    const latlng = L.latLng(lat, lng);

    // Act
    const result = convertLatLngToWorldCoordinate(latlng);

    // Assert
    expect(result.x).toBe(expectedX);
    expect(result.z).toBe(expectedZ);
  });

  test.each([
    { description: '正のlat/lngを変換したら対応する正のx/zになる', lat: 10, lng: 20, expectedX: 20, expectedZ: 10 },
    {
      description: '負のlat/lngを変換したら対応する負のx/zになる',
      lat: -10,
      lng: -20,
      expectedX: -20,
      expectedZ: -10,
    },
    {
      description: '小数点を含むlat/lngを変換したら整数に切り捨てられる',
      lat: 10.9,
      lng: 20.1,
      expectedX: 20,
      expectedZ: 10,
    },
  ])('$description', ({ lat, lng, expectedX, expectedZ }) => {
    // Arrange
    const latlng = L.latLng(lat, lng);

    // Act
    const result = convertLatLngToWorldCoordinate(latlng);

    // Assert
    expect(result.x).toBe(expectedX);
    expect(result.z).toBe(expectedZ);
  });
});
