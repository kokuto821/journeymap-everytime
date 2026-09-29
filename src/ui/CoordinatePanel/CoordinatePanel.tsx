import type { FC } from 'react';
import { useState } from 'react';
import { FiAlertTriangle, FiCheck, FiCopy } from 'react-icons/fi';
import type { WorldCoordinate } from '../../domain/coordinate/WorldCoordinate';
import { writeToClipboard } from '../../infrastructure/clipboard/clipboardWriter';

export type CoordinatePanelProps = {
  /** 表示する地図クリック地点のワールド座標。未クリック時はnull */
  worldCoordinate: WorldCoordinate | null;
};

type CopyStatus = 'idle' | 'success' | 'failure';

const PLACEHOLDER_LABEL = '地図をタップして座標表示';
const COPY_BUTTON_ARIA_LABELS: Record<CopyStatus, string> = {
  idle: 'コピー',
  success: 'コピーしました',
  failure: 'コピーに失敗しました',
};
const COPY_BUTTON_ICONS: Record<CopyStatus, typeof FiCopy> = {
  idle: FiCopy,
  success: FiCheck,
  failure: FiAlertTriangle,
};

/** WorldCoordinateを座標表示・クリップボードコピー双方で使う「x, z」形式の文字列へ変換する */
const formatWorldCoordinate = (worldCoordinate: WorldCoordinate): string => `${worldCoordinate.x}, ${worldCoordinate.z}`;

/** S-01 TopAppBar相当。地図クリック地点の座標表示とクリップボードコピーを行う。 */
export const CoordinatePanel: FC<CoordinatePanelProps> = ({ worldCoordinate }) => {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  // 直前にレンダリングされたworldCoordinateを保持し、変化を検知したらcopyStatusをレンダリング中にリセットする。
  // 座標が変わった後も古いコピー結果表示が残り続けるバグを、useEffectを使わずReactの
  // 「レンダリング中のstate調整」パターン(https://react.dev/learn/you-might-not-need-an-effect)で解消する。
  const [prevWorldCoordinate, setPrevWorldCoordinate] = useState(worldCoordinate);
  if (worldCoordinate !== prevWorldCoordinate) {
    setPrevWorldCoordinate(worldCoordinate);
    setCopyStatus('idle');
  }

  const handleCopy = async () => {
    if (!worldCoordinate) {
      return;
    }
    const succeeded = await writeToClipboard(formatWorldCoordinate(worldCoordinate));
    setCopyStatus(succeeded ? 'success' : 'failure');
  };

  const style = {
    bar: 'absolute top-m left-1/2 -translate-x-1/2 z-overlay flex items-center gap-m h-12 px-m border-token border-solid border-outline rounded-full bg-surface shadow-token',
    coordinateText: 'text-on-surface',
    coordinateTextWithValue: 'font-mono text-on-surface',
    buttonBase:
      'flex items-center justify-center w-11 h-11 border-none rounded-full cursor-pointer enabled:active:translate-x-token enabled:active:translate-y-token disabled:cursor-not-allowed disabled:opacity-50',
    buttonVariant: {
      idle: 'bg-primary text-on-primary',
      success: 'bg-primary text-on-primary',
      failure: 'bg-error text-on-primary',
    } satisfies Record<CopyStatus, string>,
  };

  const CopyIcon = COPY_BUTTON_ICONS[copyStatus];
  const copyButtonAriaLabel = COPY_BUTTON_ARIA_LABELS[copyStatus];

  return (
    <div className={style.bar}>
      <span className={worldCoordinate ? style.coordinateTextWithValue : style.coordinateText}>
        {worldCoordinate ? formatWorldCoordinate(worldCoordinate) : PLACEHOLDER_LABEL}
      </span>
      <button
        type="button"
        className={`${style.buttonBase} ${style.buttonVariant[copyStatus]}`}
        onClick={handleCopy}
        disabled={!worldCoordinate}
        aria-label={copyButtonAriaLabel}
        title={copyButtonAriaLabel}
      >
        <CopyIcon aria-hidden="true" />
      </button>
    </div>
  );
};
