import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, test } from 'vitest';
import { DEFAULT_THEME_NAME } from '../../../domain/theme/ThemeName';
import { useThemeStore } from '../../state/useThemeStore';
import { ThemeSwitch } from '../ThemeSwitch';
import { expectButtonPressed } from './helpers/themeSwitchTestHelpers';

// 各テスト前にstoreとDOMの状態を初期値へリセットする(zustand storeはモジュールスコープの単一インスタンスのため)
beforeEach(() => {
  useThemeStore.setState({ themeName: DEFAULT_THEME_NAME });
  document.documentElement.dataset.theme = DEFAULT_THEME_NAME;
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
