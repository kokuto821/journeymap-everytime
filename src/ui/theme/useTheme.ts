import { useThemeStore, type ThemeState } from '../state/useThemeStore';

/**
 * useThemeStore(zustand)への薄いラッパー。
 * 戻り値の形は従来のThemeContext版から変えていない。
 */
export const useTheme = (): ThemeState => {
  const themeName = useThemeStore((state) => state.themeName);
  const setThemeName = useThemeStore((state) => state.setThemeName);

  return { themeName, setThemeName };
};
