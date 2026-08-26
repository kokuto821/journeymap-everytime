import { THEME_NAMES } from './domain/theme/ThemeName';
import { useTheme } from './ui/theme/useTheme';
import './App.css';

const THEME_LABELS: Record<(typeof THEME_NAMES)[number], string> = {
  simple: 'シンプル',
  retro: 'レトロゲーム',
};

/**
 * テーマ基盤の動作確認用の暫定シェル。
 * 地図ビュー(S-01)の実装(F-001)で本来の画面に置き換える。
 * ここに置いたテーマ切替も暫定で、S-01上での配置は #5 / F-002 側で決める。
 */
function App() {
  const { themeName, setThemeName } = useTheme();

  return (
    <main className="app-shell">
      <section className="app-panel">
        <h1>マイクラMAPエディター</h1>
        <p>地図ビュー(S-01)は F-001 で実装する。現在はテーマ基盤の動作確認用の暫定画面。</p>

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
      </section>
    </main>
  );
}

export default App;
