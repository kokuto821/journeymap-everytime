import { THEME_NAMES } from '../../domain/theme/ThemeName';
import { useThemeStore } from '../state/useThemeStore';

const THEME_LABELS: Record<(typeof THEME_NAMES)[number], string> = {
  simple: 'シンプル',
  retro: 'レトロゲーム',
};

/** テーマ切替ボタン群。S-01の正式なUI配置(#5/F-002)が決まるまでの暫定コンポーネント。 */
export const ThemeSwitch = () => {
  const themeName = useThemeStore((state) => state.themeName);
  const setThemeName = useThemeStore((state) => state.setThemeName);

  // ピル形状のボタンバー。両テーマとも丸形状を維持する(design.mdの例外指定)
  // レトロテーマでは押下時に影が消えて右下へ沈み込む(シンプルテーマでは--press-offsetが0のため無効)
  const style = {
    group:
      'absolute top-m right-m z-overlay flex gap-xs p-2xs border-token border-solid border-outline rounded-full bg-surface shadow-token',
    button:
      'py-2xs px-s border-none rounded-full cursor-pointer active:translate-x-token active:translate-y-token',
    buttonInactive: 'bg-transparent text-on-surface-variant',
    buttonActive: 'bg-primary text-on-primary',
  };

  return (
    <div className={style.group} role="group" aria-label="テーマ切替">
      {THEME_NAMES.map((name) => {
        const isPressed = name === themeName;

        return (
          <button
            key={name}
            type="button"
            className={`${style.button} ${isPressed ? style.buttonActive : style.buttonInactive}`}
            aria-pressed={isPressed}
            onClick={() => setThemeName(name)}
          >
            {THEME_LABELS[name]}
          </button>
        );
      })}
    </div>
  );
};
