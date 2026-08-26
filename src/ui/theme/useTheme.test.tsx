import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import type { ThemeName } from '../../domain/theme/ThemeName';
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

function renderProbe(initialThemeName?: ThemeName) {
  return render(
    <ThemeProvider initialThemeName={initialThemeName}>
      <ThemeProbe />
    </ThemeProvider>,
  );
}

describe('ThemeProvider / useTheme', () => {
  test('初期テーマを指定せずに描画したらシンプルテーマが適用される', () => {
    // Act
    renderProbe();

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent('simple');
    expect(document.documentElement.dataset.theme).toBe('simple');
  });

  test('初期テーマにレトロを指定して描画したらレトロテーマが適用される', () => {
    // Act
    renderProbe('retro');

    // Assert
    expect(document.documentElement.dataset.theme).toBe('retro');
  });

  test('setThemeNameでレトロテーマに切り替えたらdata-theme属性がretroになる', async () => {
    // Arrange
    const user = userEvent.setup();
    renderProbe();

    // Act
    await user.click(screen.getByRole('button', { name: 'レトロにする' }));

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent('retro');
    expect(document.documentElement.dataset.theme).toBe('retro');
  });

  test('レトロテーマからシンプルテーマに戻したらdata-theme属性がsimpleになる', async () => {
    // Arrange
    const user = userEvent.setup();
    renderProbe('retro');

    // Act
    await user.click(screen.getByRole('button', { name: 'シンプルにする' }));

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent('simple');
    expect(document.documentElement.dataset.theme).toBe('simple');
  });

  test('ThemeProviderの外でuseThemeを呼んだらエラーを投げる', () => {
    // Act / Assert
    expect(() => render(<ThemeProbe />)).toThrow(/ThemeProvider/);
  });
});
