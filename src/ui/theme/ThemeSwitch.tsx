import { THEME_NAMES } from '../../domain/theme/ThemeName';
import { useTheme } from './useTheme';

const THEME_LABELS: Record<(typeof THEME_NAMES)[number], string> = {
  simple: 'シンプル',
  retro: 'レトロゲーム',
};

/** テーマ切替ボタン群。S-01の正式なUI配置(#5/F-002)が決まるまでの暫定コンポーネント。 */
export function ThemeSwitch() {
  const { themeName, setThemeName } = useTheme();

  return (
    <div className="theme-switch" role="group" aria-label="テーマ切替">
      {THEME_NAMES.map((name) => (
        <button
          key={name}
          type="button"
          className="theme-switch__button"
          aria-pressed={name === themeName}
          onClick={() => setThemeName(name)}
        >
          {THEME_LABELS[name]}
        </button>
      ))}
    </div>
  );
}
