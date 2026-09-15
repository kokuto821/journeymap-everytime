import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useTileLayerUrl } from '../useTileLayerUrl';

describe('useTileLayerUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test.each([
    { layerType: 'night' as const, expected: 'https://example.com/tiles/night/{z}/{x},{y}.png' },
    { layerType: 'biome' as const, expected: 'https://example.com/tiles/biome/{z}/{x},{y}.png' },
  ])(
    'layerTypeが$layerTypeの場合、対応するタイルURLテンプレートを返す',
    ({ layerType, expected }) => {
      // Arrange
      vi.stubEnv('VITE_R2_BASE_URL', 'https://example.com');

      // Act
      const { result } = renderHook(() => useTileLayerUrl(layerType));

      // Assert
      expect(result.current).toBe(expected);
    },
  );
});
