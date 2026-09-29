import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createWorldCoordinate } from '../../../domain/coordinate/WorldCoordinate';
import { writeToClipboard } from '../../../infrastructure/clipboard/clipboardWriter';
import { CoordinatePanel } from '../CoordinatePanel';

vi.mock('../../../infrastructure/clipboard/clipboardWriter', () => ({
  writeToClipboard: vi.fn(),
}));

const writeToClipboardMock = vi.mocked(writeToClipboard);

describe('CoordinatePanel', () => {
  afterEach(() => {
    writeToClipboardMock.mockReset();
  });

  test('worldCoordinateがnullのときプレースホルダ文言が表示される', () => {
    // Arrange & Act
    render(<CoordinatePanel worldCoordinate={null} />);

    // Assert
    expect(screen.getByText('地図をタップして座標表示')).toBeInTheDocument();
  });

  test('worldCoordinateがnullのときコピーボタンがdisabledである', () => {
    // Arrange & Act
    render(<CoordinatePanel worldCoordinate={null} />);

    // Assert
    expect(screen.getByRole('button', { name: 'コピー' })).toBeDisabled();
  });

  test('worldCoordinateが指定されているとき「X, Z」形式で座標が表示される', () => {
    // Arrange
    const worldCoordinate = createWorldCoordinate({ x: 123, z: -456 });

    // Act
    render(<CoordinatePanel worldCoordinate={worldCoordinate} />);

    // Assert
    expect(screen.getByText('123, -456')).toBeInTheDocument();
  });

  test('コピーボタン押下でwriteToClipboardが「x, z」形式の文字列で呼ばれる', async () => {
    // Arrange
    const worldCoordinate = createWorldCoordinate({ x: 123, z: -456 });
    writeToClipboardMock.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<CoordinatePanel worldCoordinate={worldCoordinate} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'コピー' }));

    // Assert
    expect(writeToClipboardMock).toHaveBeenCalledWith('123, -456');
  });

  test('コピー成功時に成功が分かる表示になる', async () => {
    // Arrange
    const worldCoordinate = createWorldCoordinate({ x: 123, z: -456 });
    writeToClipboardMock.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<CoordinatePanel worldCoordinate={worldCoordinate} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'コピー' }));

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'コピーしました' })).toBeInTheDocument();
    });
  });

  test('コピー失敗時に失敗が分かる表示になる', async () => {
    // Arrange
    const worldCoordinate = createWorldCoordinate({ x: 123, z: -456 });
    writeToClipboardMock.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<CoordinatePanel worldCoordinate={worldCoordinate} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'コピー' }));

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'コピーに失敗しました' })).toBeInTheDocument();
    });
    expect(screen.getByText('123, -456')).toBeInTheDocument();
  });
});
