import { inflateSync } from 'node:zlib';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MapView, TRANSPARENT_TILE_URL } from '../MapView';
import { fetchTileMetadata } from '../../../infrastructure/tile/tileMetadataProvider';

vi.mock('../../../infrastructure/tile/tileMetadataProvider', () => ({
  fetchTileMetadata: vi.fn(),
}));

const fetchTileMetadataMock = vi.mocked(fetchTileMetadata);

/** PNGのチャンク列からIDATチャンクのデータを取り出す。 */
function extractPngIdat(buffer: Buffer): Buffer {
  const PNG_SIGNATURE_LENGTH = 8;
  let offset = PNG_SIGNATURE_LENGTH;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') {
      return buffer.subarray(offset + 8, offset + 8 + length);
    }
    offset += 12 + length;
  }
  throw new Error('IDATチャンクが見つかりません');
}

describe('TRANSPARENT_TILE_URL', () => {
  test('完全に透明な1x1pxのRGBA PNGである', () => {
    // Arrange
    const base64 = TRANSPARENT_TILE_URL.replace('data:image/png;base64,', '');
    const idat = extractPngIdat(Buffer.from(base64, 'base64'));

    // Act
    const rawScanline = inflateSync(idat);

    // Assert
    expect(Array.from(rawScanline)).toStrictEqual([0, 0, 0, 0, 0]);
  });
});

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
