import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MapView } from '../MapView';
import { fetchTileMetadata } from '../../../infrastructure/tile/tileMetadataProvider';

vi.mock('../../../infrastructure/tile/tileMetadataProvider', () => ({
  fetchTileMetadata: vi.fn(),
}));

const fetchTileMetadataMock = vi.mocked(fetchTileMetadata);

describe('MapView', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    fetchTileMetadataMock.mockReset();
  });

  test('metadata取得中はローディング表示になる', () => {
    // Arrange
    vi.stubEnv('VITE_R2_BASE_URL', 'https://example.com');
    fetchTileMetadataMock.mockReturnValue(new Promise(() => {}));

    // Act
    render(<MapView />);

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent('地図データを読み込み中...');
  });

  test('metadata取得後は地図が表示される', async () => {
    // Arrange
    vi.stubEnv('VITE_R2_BASE_URL', 'https://example.com');
    fetchTileMetadataMock.mockResolvedValue({
      zMax: 5,
      minZoom: 1,
      tileSize: 512,
      layers: {},
    });

    // Act
    render(<MapView />);

    // Assert
    await waitFor(() => {
      expect(document.querySelector('.leaflet-container')).toBeInTheDocument();
    });
  });

  test('metadata取得に失敗したらエラーメッセージを表示する', async () => {
    // Arrange
    vi.stubEnv('VITE_R2_BASE_URL', 'https://example.com');
    fetchTileMetadataMock.mockRejectedValue(new Error('network error'));

    // Act
    render(<MapView />);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('地図データの読み込みに失敗しました');
    });
  });

  test('VITE_R2_BASE_URLが未設定ならエラーメッセージを表示する', async () => {
    // Arrange
    vi.stubEnv('VITE_R2_BASE_URL', undefined);

    // Act
    render(<MapView />);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('地図データの読み込みに失敗しました');
    });
    expect(fetchTileMetadataMock).not.toHaveBeenCalled();
  });
});
