import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'vitest';
import { useThemeStore } from '../../state/useThemeStore';
import { resetThemeStore } from '../../state/_test_/helpers/themeStoreTestHelpers';
import { ThemeProbe } from './helpers/ThemeProbe';

beforeEach(() => {
  resetThemeStore();
});

describe('useTheme', () => {
  test('初期状態で描画したらuseThemeが返すthemeNameがsimpleになる', () => {
    // Act
    render(<ThemeProbe testId="theme-name" buttonLabel="レトロにする" targetTheme="retro" />);

    // Assert
    expect(screen.getByTestId('theme-name')).toHaveTextContent('simple');
  });

  test('storeの初期値をretroに設定して描画したらuseThemeが返すthemeNameがretroになる', () => {
    // Arrange
    useThemeStore.setState({ themeName: 'retro' });

    // Act
    render(<ThemeProbe testId="theme-name" buttonLabel="シンプルにする" targetTheme="simple" />);

    // Assert
    expect(screen.getByTestId('theme-name')).toHaveTextContent('retro');
  });

  test('複数コンポーネントでuseThemeを呼んでいる場合に一方のsetThemeNameを呼んだらもう一方のthemeNameにも反映される', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(
      <>
        <ThemeProbe testId="primary-theme-name" buttonLabel="プライマリをレトロにする" targetTheme="retro" />
        <ThemeProbe
          testId="secondary-theme-name"
          buttonLabel="セカンダリをレトロにする"
          targetTheme="retro"
        />
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'セカンダリをレトロにする' }));

    // Assert
    expect(screen.getByTestId('primary-theme-name')).toHaveTextContent('retro');
  });
});
