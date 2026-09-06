import { THEME_NAMES } from './domain/theme/ThemeName';
import { useTheme } from './ui/theme/useTheme';
import { MapView } from './ui/map-view/MapView';
import './App.css';

const THEME_LABELS: Record<(typeof THEME_NAMES)[number], string> = {
  simple: 'シンプル',
  retro: 'レトロゲーム',
};

/**
 * S-01地図ビュー画面(F-001)。テーマ切替はS-01の正式なUI配置(#5/F-002)が決まるまでの暫定オーバーレイ。
 */
function App() {
  const { themeName, setThemeName } = useTheme();

  return (
    <main className="app-shell">
      <MapView />

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
    </main>
  );
}

export default App;
