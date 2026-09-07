import { create } from 'zustand';
import { DEFAULT_THEME_NAME, type ThemeName } from '../../domain/theme/ThemeName';

type ThemeState = {
  /** 現在選択中のテーマ名 */
  themeName: ThemeName;
  /** テーマ名を更新する */
  setThemeName: (name: ThemeName) => void;
};

/**
 * 選択中のテーマを保持するzustand store。
 * themeName変更時にルート要素のdata-theme属性を更新する副作用をsubscribeで持つため、
 * Reactのライフサイクル(useEffect等)に依存せずに動作する。
 * 配色・影・フォントの実体は src/styles/theme.css の data-theme セレクタ側が持つ。
 */
export const useThemeStore = create<ThemeState>((set) => ({
  themeName: DEFAULT_THEME_NAME,
  setThemeName: (name) => set({ themeName: name }),
}));

useThemeStore.subscribe((state) => {
  document.documentElement.dataset.theme = state.themeName;
});

document.documentElement.dataset.theme = useThemeStore.getState().themeName;
