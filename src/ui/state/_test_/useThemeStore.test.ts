import { beforeEach, describe, expect, test } from 'vitest';
import { DEFAULT_THEME_NAME } from '../../../domain/theme/ThemeName';
import { useThemeStore } from '../useThemeStore';

// 各テスト前にstoreとDOMの状態を初期値へリセットする(zustand storeはモジュールスコープの単一インスタンスのため)
beforeEach(() => {
  useThemeStore.setState({ themeName: DEFAULT_THEME_NAME });
  document.documentElement.dataset.theme = DEFAULT_THEME_NAME;
});

describe('themeNameの状態', () => {
  test('初期状態を参照したらthemeNameがDEFAULT_THEME_NAMEになる', () => {
    // Arrange (beforeEachで初期化済み)
    // Act
    const { themeName } = useThemeStore.getState();

    // Assert
    expect(themeName).toBe(DEFAULT_THEME_NAME);
  });

  test('setThemeNameでretroに切り替えたらthemeNameがretroになる', () => {
    // Act
    useThemeStore.getState().setThemeName('retro');

    // Assert
    expect(useThemeStore.getState().themeName).toBe('retro');
  });
});

describe('data-theme属性への反映', () => {
  test('初期状態を参照したらdata-theme属性がDEFAULT_THEME_NAMEになる', () => {
    // Arrange (beforeEachで初期化済み)
    // Assert
    expect(document.documentElement.dataset.theme).toBe(DEFAULT_THEME_NAME);
  });

  test('setThemeNameでretroに切り替えたらdata-theme属性がretroになる', () => {
    // Act
    useThemeStore.getState().setThemeName('retro');

    // Assert
    expect(document.documentElement.dataset.theme).toBe('retro');
  });

  test('retroからsetThemeNameでsimpleに戻したらdata-theme属性がsimpleに戻る', () => {
    // Arrange
    useThemeStore.getState().setThemeName('retro');

    // Act
    useThemeStore.getState().setThemeName('simple');

    // Assert
    expect(document.documentElement.dataset.theme).toBe('simple');
  });

  test('simpleの状態でsetThemeNameにsimpleを渡しても例外を投げない', () => {
    // Act
    const act = () => useThemeStore.getState().setThemeName('simple');

    // Assert
    expect(act).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe('simple');
  });
});
