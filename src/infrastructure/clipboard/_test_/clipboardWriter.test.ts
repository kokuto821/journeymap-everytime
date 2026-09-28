import { afterEach, expect, test, vi } from 'vitest';
import { writeToClipboard } from '../clipboardWriter';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('navigator.clipboard.writeTextが成功したら成功を返す', async () => {
  // Arrange
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });

  // Act
  const result = await writeToClipboard('hello');

  // Assert
  expect(result).toBe(true);
});

test('navigator.clipboard.writeTextが失敗したら失敗を返す', async () => {
  // Arrange
  const writeText = vi.fn().mockRejectedValue(new Error('denied'));
  vi.stubGlobal('navigator', { clipboard: { writeText } });

  // Act
  const result = await writeToClipboard('hello');

  // Assert
  expect(result).toBe(false);
});

test('navigator.clipboard自体が存在しない環境では失敗を返す', async () => {
  // Arrange
  vi.stubGlobal('navigator', {});

  // Act
  const result = await writeToClipboard('hello');

  // Assert
  expect(result).toBe(false);
});

test('渡した文字列がそのままwriteTextに渡される', async () => {
  // Arrange
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });

  // Act
  await writeToClipboard('123, 456');

  // Assert
  expect(writeText).toHaveBeenCalledWith('123, 456');
});
