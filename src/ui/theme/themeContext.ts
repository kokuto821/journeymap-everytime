import { createContext } from 'react';
import type { ThemeName } from '../../domain/theme/ThemeName';

export type ThemeContextValue = {
  themeName: ThemeName;
  setThemeName: (themeName: ThemeName) => void;
};

// Fast Refreshを壊さないよう、コンテキストはProvider/フックとは別モジュールに置く
export const ThemeContext = createContext<ThemeContextValue | null>(null);
