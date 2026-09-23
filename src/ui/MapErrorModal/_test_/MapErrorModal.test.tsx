import { render, screen } from '@testing-library/react';
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
});
