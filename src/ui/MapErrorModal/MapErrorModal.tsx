import type { FC } from 'react';

export type MapErrorModalProps = {
  /** 再試行ボタン押下時に呼ばれるコールバック */
  onRetry: () => void;
};

/** 地図データの読み込み失敗を通知するモーダル。閉じるボタンは無く再試行のみで復帰する行き止まりUI。 */
export const MapErrorModal: FC<MapErrorModalProps> = ({ onRetry }) => {
  const style = {
    overlay: 'fixed inset-0 z-overlay flex items-center justify-center bg-scrim',
    card: 'flex flex-col items-center gap-m p-l border-token border-solid border-outline rounded-2xl bg-surface shadow-token',
    message: 'text-on-surface',
    button:
      'py-2xs px-s border-none rounded-full cursor-pointer bg-primary text-on-primary active:translate-x-token active:translate-y-token',
  };

  return (
    <div className={style.overlay}>
      <div className={style.card}>
        <p className={style.message} role="alert">
          地図データの読み込みに失敗しました
        </p>
        <button type="button" className={style.button} onClick={onRetry}>
          再試行
        </button>
      </div>
    </div>
  );
};
