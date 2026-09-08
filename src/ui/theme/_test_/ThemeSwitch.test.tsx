import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, test } from 'vitest';
import { resetThemeStore } from '../../state/_test_/helpers/themeStoreTestHelpers';
import { ThemeSwitch } from '../ThemeSwitch';
import { expectButtonPressed } from './helpers/themeSwitchTestHelpers';

beforeEach(() => {
  resetThemeStore();
});

describe('ThemeSwitch', () => {
  test('描画したらシンプルテーマが選択された状態になる', () => {
    // Act
    render(<ThemeSwitch />);

    // Assert
    expectButtonPressed('シンプル', true);
    expectButtonPressed('レトロゲーム', false);
  });

  test('レトロゲームのボタンを押したらレトロテーマが選択される', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ThemeSwitch />);

    // Act
    await user.click(screen.getByRole('button', { name: 'レトロゲーム' }));

    // Assert
    expectButtonPressed('レトロゲーム', true);
    expectButtonPressed('シンプル', false);
  });

  test('レトロからシンプルに戻したらシンプルテーマが選択される', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ThemeSwitch />);
    await user.click(screen.getByRole('button', { name: 'レトロゲーム' }));

    // Act
    await user.click(screen.getByRole('button', { name: 'シンプル' }));

    // Assert
    expectButtonPressed('シンプル', true);
  });
});
