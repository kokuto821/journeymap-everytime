import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './useTheme';

function ThemeProbe() {
  const { themeName, setThemeName } = useTheme();

  return (
    <>
      <output>{themeName}</output>
      <button type="button" onClick={() => setThemeName('retro')}>
        レトロにする
      </button>
      <button type="button" onClick={() => setThemeName('simple')}>
        シンプルにする
      </button>
    </>
  );
}

function renderWithProvider() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
}

describe('ThemeProvider / useTheme', () => {
  test('既定でシンプルテーマが適用される', () => {
    renderWithProvider();

    expect(screen.getByRole('status')).toHaveTextContent('simple');
    expect(document.documentElement.dataset.theme).toBe('simple');
  });

  test('初期テーマを指定できる', () => {
    render(
      <ThemeProvider initialThemeName="retro">
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(document.documentElement.dataset.theme).toBe('retro');
  });

  test('テーマを切り替えるとルート要素のdata-theme属性が変わる', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: 'レトロにする' }));

    expect(screen.getByRole('status')).toHaveTextContent('retro');
    expect(document.documentElement.dataset.theme).toBe('retro');

    await user.click(screen.getByRole('button', { name: 'シンプルにする' }));

    expect(document.documentElement.dataset.theme).toBe('simple');
  });

  test('ThemeProviderの外でuseThemeを使うとエラーになる', () => {
    expect(() => render(<ThemeProbe />)).toThrow(/ThemeProvider/);
  });
});
