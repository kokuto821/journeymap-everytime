import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MapView, TRANSPARENT_TILE_URL } from '../MapView';
import { fetchTileMetadata } from '../../../infrastructure/tile/tileMetadataProvider';

vi.mock('../../../infrastructure/tile/tileMetadataProvider', () => ({
  fetchTileMetadata: vi.fn(),
}));

const fetchTileMetadataMock = vi.mocked(fetchTileMetadata);

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

type PngChunks = {
  width: number;
  height: number;
  colorType: number;
  idat: number[];
};

/** PNGのチャンク列からIHDR(幅・高さ・カラータイプ)とIDATを取り出す。 */
function parsePng(bytes: Uint8Array): PngChunks {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const PNG_SIGNATURE_LENGTH = 8;
  let offset = PNG_SIGNATURE_LENGTH;
  let ihdr: { width: number; height: number; colorType: number } | undefined;
  let idat: number[] | undefined;

  while (offset < bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const data = bytes.subarray(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      ihdr = {
        width: new DataView(data.buffer, data.byteOffset).getUint32(0),
        height: new DataView(data.buffer, data.byteOffset).getUint32(4),
        colorType: data[9],
      };
    }
    if (type === 'IDAT') {
      idat = Array.from(data);
    }

    offset += 12 + length;
  }

  if (!ihdr || !idat) {
    throw new Error('IHDR/IDATチャンクが見つかりません');
  }
  return { ...ihdr, idat };
}

describe('TRANSPARENT_TILE_URL', () => {
  test('完全に透明な1x1pxのRGBA PNGである', () => {
    // Arrange
    const base64 = TRANSPARENT_TILE_URL.replace('data:image/png;base64,', '');

    // Act
    const png = parsePng(base64ToBytes(base64));

    // Assert
    // colorType=6はPNG仕様上RGBA(アルファチャンネル有り)を表す。
    // IDATは`filter=0, RGBA=(0,0,0,0)`(完全に透明)をzlib圧縮した既知のバイト列(圧縮方式に依存しないよう固定値で照合する)。
    expect(png).toStrictEqual({
      width: 1,
      height: 1,
      colorType: 6,
      idat: [120, 156, 99, 96, 0, 2, 0, 0, 5, 0, 1],
    });
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

  test('metadataのtileSizeがタイル画像のサイズに反映される(ハードコードしない)', async () => {
    // Arrange
    vi.stubEnv('VITE_R2_BASE_URL', 'https://example.com');
    fetchTileMetadataMock.mockResolvedValue({
      zMax: 5,
      minZoom: 1,
      tileSize: 256,
      layers: {},
    });

    // Act
    render(<MapView />);

    // Assert
    await waitFor(() => {
      const tile = document.querySelector<HTMLElement>('.leaflet-tile');
      expect(tile).not.toBeNull();
      expect(tile).toHaveStyle({ width: '256px', height: '256px' });
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
