import { afterEach, describe, expect, test, vi } from 'vitest';
import { getR2BaseUrl } from '../env';

describe('getR2BaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('VITE_R2_BASE_URLが設定されていたらその値を返す', () => {
    // Arrange
    vi.stubEnv('VITE_R2_BASE_URL', 'https://example.com/tiles-root');

    // Act
    const result = getR2BaseUrl();

    // Assert
    expect(result).toBe('https://example.com/tiles-root');
  });

  test('VITE_R2_BASE_URLが未設定なら例外を投げる', () => {
    // Arrange
    vi.stubEnv('VITE_R2_BASE_URL', undefined);

    // Act, Assert
    expect(() => getR2BaseUrl()).toThrow('VITE_R2_BASE_URL');
  });

  test('VITE_R2_BASE_URLが空文字なら例外を投げる', () => {
    // Arrange
    vi.stubEnv('VITE_R2_BASE_URL', '');

    // Act, Assert
    expect(() => getR2BaseUrl()).toThrow('VITE_R2_BASE_URL');
  });
});
