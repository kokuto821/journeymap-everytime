import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchTileMetadata } from '../tileMetadataProvider';

const stubFetch = (response: { ok: boolean; status?: number; json?: () => Promise<unknown> }) => {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('fetchTileMetadata', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('metadata.jsonを取得しパースして返す', async () => {
    // Arrange
    const metadata = {
      zMax: 5,
      minZoom: 1,
      tileSize: 512,
      layers: { day: { minX: -4, maxX: 23, minY: -10, maxY: 10 } },
    };
    stubFetch({ ok: true, json: () => Promise.resolve(metadata) });

    // Act
    const result = await fetchTileMetadata('https://example.com');

    // Assert
    expect(result).toStrictEqual(metadata);
  });

  test('baseUrlの末尾スラッシュを除去してmetadata.jsonのURLを組み立てる', async () => {
    // Arrange
    const fetchMock = stubFetch({
      ok: true,
      json: () => Promise.resolve({ zMax: 0, minZoom: 0, tileSize: 512, layers: {} }),
    });

    // Act
    await fetchTileMetadata('https://example.com/');

    // Assert
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/metadata.json');
  });

  test('レスポンスが正常でなければ例外を投げる', async () => {
    // Arrange
    stubFetch({ ok: false, status: 404 });

    // Act
    const act = () => fetchTileMetadata('https://example.com');

    // Assert
    await expect(act).rejects.toThrow('404');
  });
});
