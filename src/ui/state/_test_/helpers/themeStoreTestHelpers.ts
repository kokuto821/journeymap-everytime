import { DEFAULT_THEME_NAME } from '../../../../domain/theme/ThemeName';
import { useThemeStore } from '../../useThemeStore';

/**
 * useThemeStoreとdata-theme属性を初期状態にリセットするヘルパー。
 * zustand storeはモジュールスコープの単一インスタンスのため、各テスト前に呼び出す想定。
 */
export const resetThemeStore = () => {
  useThemeStore.setState({ themeName: DEFAULT_THEME_NAME });
  document.documentElement.dataset.theme = DEFAULT_THEME_NAME;
};
