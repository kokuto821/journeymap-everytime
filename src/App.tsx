import { MapView } from './ui/map-view/MapView';
import { ThemeSwitch } from './ui/theme/ThemeSwitch';
import './App.css';

/**
 * S-01地図ビュー画面(F-001)。テーマ切替はS-01の正式なUI配置(#5/F-002)が決まるまでの暫定オーバーレイ。
 */
function App() {
  return (
    <main className="app-shell">
      <MapView />
      <ThemeSwitch />
    </main>
  );
}

export default App;
