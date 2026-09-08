import { create } from 'zustand';
import { DEFAULT_THEME_NAME, type ThemeName } from '../../domain/theme/ThemeName';

export type ThemeState = {
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

// themeName変更をdata-theme属性へ反映する副作用を、モジュール読み込み時にトップレベルで登録する。
// ThemeProvider撤去後はこの副作用を発火させるReactコンポーネントのライフサイクル(マウント/useEffect)が
// 存在しないため、あえてReactに依存させず、storeの生成と同じタイミングで購読させることで
// 「テーマ変更時に必ずDOMへ反映される」という不変条件をProviderの有無に関係なく保証する設計判断
// (詳細はdesign.md参照)。
useThemeStore.subscribe((state) => {
  document.documentElement.dataset.theme = state.themeName;
});

// 上記subscribeは以後の変更のみを捕捉するため、初期状態(DEFAULT_THEME_NAME)についても
// モジュール読み込み時点で同様に即時反映し、初回描画からdata-theme属性が欠落しないようにする。
document.documentElement.dataset.theme = useThemeStore.getState().themeName;
