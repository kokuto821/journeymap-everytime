import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { ThemeProvider } from './ui/theme/ThemeProvider';

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

describe('App', () => {
  it('見出しを描画する', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'マイクラMAPエディター' })).toBeInTheDocument();
  });

  it('既定ではシンプルテーマが選択されている', () => {
    renderApp();

    expect(screen.getByRole('button', { name: 'シンプル' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(document.documentElement.dataset.theme).toBe('simple');
  });

  it('テーマ切替ボタンで選択中のテーマが変わる', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'レトロゲーム' }));

    expect(screen.getByRole('button', { name: 'レトロゲーム' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(document.documentElement.dataset.theme).toBe('retro');
  });
});
