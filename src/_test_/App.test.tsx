import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import App from '../App';
import { ThemeProvider } from '../ui/theme/ThemeProvider';

vi.mock('../ui/map-view/MapView', () => ({
  MapView: () => <div data-testid="map-view-stub" />,
}));

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

describe('App', () => {
  test('アプリを描画したら地図ビューが表示される', () => {
    // Act
    renderApp();

    // Assert
    expect(screen.getByTestId('map-view-stub')).toBeInTheDocument();
  });

  test('アプリを描画したらシンプルテーマが選択された状態になる', () => {
    // Act
    renderApp();

    // Assert
    expect(screen.getByRole('button', { name: 'シンプル' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(document.documentElement.dataset.theme).toBe('simple');
  });

  test('レトロゲームのテーマ切替ボタンを押したらレトロテーマが選択される', async () => {
    // Arrange
    const user = userEvent.setup();
    renderApp();

    // Act
    await user.click(screen.getByRole('button', { name: 'レトロゲーム' }));

    // Assert
    expect(screen.getByRole('button', { name: 'レトロゲーム' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(document.documentElement.dataset.theme).toBe('retro');
  });
});
