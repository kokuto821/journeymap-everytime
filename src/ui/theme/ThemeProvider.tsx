import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_THEME_NAME, type ThemeName } from '../../domain/theme/ThemeName';
import { ThemeContext } from './themeContext';

type ThemeProviderProps = {
  children: ReactNode;
  initialThemeName?: ThemeName;
};

/**
 * 選択中のテーマをルート要素の data-theme 属性に反映する。
 * 配色・影・フォントの実体は src/styles/theme.css の data-theme セレクタ側が持つ。
 */
export function ThemeProvider({
  children,
  initialThemeName = DEFAULT_THEME_NAME,
}: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(initialThemeName);

  useEffect(() => {
    document.documentElement.dataset.theme = themeName;
  }, [themeName]);

  const value = useMemo(() => ({ themeName, setThemeName }), [themeName]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
