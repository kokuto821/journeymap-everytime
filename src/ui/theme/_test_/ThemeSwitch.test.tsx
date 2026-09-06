import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { ThemeSwitch } from '../ThemeSwitch';
import { ThemeProvider } from '../ThemeProvider';

function renderThemeSwitch() {
  return render(
    <ThemeProvider>
      <ThemeSwitch />
    </ThemeProvider>,
  );
}

describe('ThemeSwitch', () => {
  test('描画したらシンプルテーマが選択された状態になる', () => {
    // Act
    renderThemeSwitch();

    // Assert
    expect(screen.getByRole('button', { name: 'シンプル' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(document.documentElement.dataset.theme).toBe('simple');
  });

  test('レトロゲームのボタンを押したらレトロテーマが選択される', async () => {
    // Arrange
    const user = userEvent.setup();
    renderThemeSwitch();

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
