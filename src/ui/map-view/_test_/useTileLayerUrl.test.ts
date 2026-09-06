import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useTileLayerUrl } from '../useTileLayerUrl';

describe('useTileLayerUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('layerTypeに対応するタイルURLテンプレートを返す', () => {
    // Arrange
    vi.stubEnv('VITE_R2_BASE_URL', 'https://example.com');

    // Act
    const { result } = renderHook(() => useTileLayerUrl('night'));

    // Assert
    expect(result.current).toBe('https://example.com/tiles/night/{z}/{x},{y}.png');
  });
});
