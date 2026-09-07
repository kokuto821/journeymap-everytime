import { useTheme } from '../../useTheme';
import type { ThemeName } from '../../../../domain/theme/ThemeName';

type ThemeProbeProps = {
  testId: string;
  buttonLabel: string;
  targetTheme: ThemeName;
};

/**
 * useTheme()の戻り値をDOMへ露出させるテスト用プローブコンポーネント。
 * 複数のuseThemeテストで使い回すため、共通ヘルパーとして切り出している。
 */
export function ThemeProbe({ testId, buttonLabel, targetTheme }: ThemeProbeProps) {
  const { themeName, setThemeName } = useTheme();

  return (
    <>
      <output data-testid={testId}>{themeName}</output>
      <button type="button" onClick={() => setThemeName(targetTheme)}>
        {buttonLabel}
      </button>
    </>
  );
}
