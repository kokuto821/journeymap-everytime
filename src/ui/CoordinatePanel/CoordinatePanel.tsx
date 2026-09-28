import type { FC } from 'react';
import { useState } from 'react';
import type { WorldCoordinate } from '../../domain/coordinate/WorldCoordinate';
import { writeToClipboard } from '../../infrastructure/clipboard/clipboardWriter';

export type CoordinatePanelProps = {
  /** 表示するワールド座標。未クリック時はnull */
  coordinate: WorldCoordinate | null;
};

type CopyStatus = 'idle' | 'success' | 'failure';

const PLACEHOLDER_LABEL = '地図をタップして座標表示';
const COPY_BUTTON_LABELS: Record<CopyStatus, string> = {
  idle: 'コピー',
  success: 'コピーしました',
  failure: 'コピーに失敗',
};

/** WorldCoordinateを座標表示・クリップボードコピー双方で使う「x, z」形式の文字列へ変換する */
const formatWorldCoordinate = (coordinate: WorldCoordinate): string => `${coordinate.x}, ${coordinate.z}`;

/** S-01 TopAppBar相当。地図クリック地点の座標表示とクリップボードコピーを行う。 */
export const CoordinatePanel: FC<CoordinatePanelProps> = ({ coordinate }) => {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  const handleCopy = async () => {
    if (!coordinate) {
      return;
    }
    const succeeded = await writeToClipboard(formatWorldCoordinate(coordinate));
    setCopyStatus(succeeded ? 'success' : 'failure');
  };

  const style = {
    bar: 'absolute top-l left-1/2 -translate-x-1/2 z-overlay flex items-center gap-m h-12 px-m border-token border-solid border-outline rounded-full bg-surface shadow-token',
    coordinateText: 'font-mono text-on-surface',
    button:
      'py-2xs px-s border-none rounded-full cursor-pointer bg-primary text-on-primary active:translate-x-token active:translate-y-token disabled:cursor-not-allowed disabled:opacity-50',
  };

  return (
    <div className={style.bar}>
      <span className={style.coordinateText}>{coordinate ? formatWorldCoordinate(coordinate) : PLACEHOLDER_LABEL}</span>
      <button type="button" className={style.button} onClick={handleCopy} disabled={!coordinate}>
        {COPY_BUTTON_LABELS[copyStatus]}
      </button>
    </div>
  );
};
