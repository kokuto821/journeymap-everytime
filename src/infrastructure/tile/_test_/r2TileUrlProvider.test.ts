import { describe, expect, test } from 'vitest';
import { LAYER_TYPES } from '../../../domain/layer/LayerType';
import { buildTileUrlTemplate } from '../r2TileUrlProvider';

describe('buildTileUrlTemplate', () => {
  test.each(LAYER_TYPES)('layerTypeが%sならタイルURLテンプレートを組み立てる', (layerType) => {
    // Act
    const result = buildTileUrlTemplate({ baseUrl: 'https://example.com', layerType });

    // Assert
    expect(result).toBe(`https://example.com/tiles/${layerType}/{z}/{x},{y}.png`);
  });

  test('baseUrlの末尾にスラッシュがあれば除去してタイルURLテンプレートを組み立てる', () => {
    // Act
    const result = buildTileUrlTemplate({ baseUrl: 'https://example.com/', layerType: 'day' });

    // Assert
    expect(result).toBe('https://example.com/tiles/day/{z}/{x},{y}.png');
  });
});
