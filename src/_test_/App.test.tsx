import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import App from '../App';
import { ThemeProvider } from '../ui/theme/ThemeProvider';

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

describe('App', () => {
  test('アプリを描画したら見出しが表示される', () => {
    // Act
    renderApp();

    // Assert
    expect(screen.getByRole('heading', { name: 'マイクラMAPエディター' })).toBeInTheDocument();
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
