import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { MapErrorModal } from '../MapErrorModal';

describe('MapErrorModal', () => {
  test('role="alert"でエラーメッセージ「地図データの読み込みに失敗しました」を表示する', () => {
    // Arrange
    const onRetry = vi.fn();

    // Act
    render(<MapErrorModal onRetry={onRetry} />);

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent('地図データの読み込みに失敗しました');
  });

  test('再試行ボタン押下でonRetryを呼ぶ', async () => {
    // Arrange
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<MapErrorModal onRetry={onRetry} />);

    // Act
    await user.click(screen.getByRole('button', { name: '再試行' }));

    // Assert
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
