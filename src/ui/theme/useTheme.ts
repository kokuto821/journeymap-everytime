import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from './themeContext';

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);

  if (value === null) {
    throw new Error('useTheme は ThemeProvider の内側で使用してください');
  }

  return value;
}
