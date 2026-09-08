import type { FC, KeyboardEvent } from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';
import { LuMountain } from 'react-icons/lu';
import { LAYER_TYPES, type LayerType } from '../../domain/layer/LayerType';
import { LAYER_LABELS } from '../../domain/layer/layerLabels';

// react-icons(UI層のライブラリ)への依存を持つため、domain層(layerLabels.ts)には置かずここに留める。
const LAYER_ICONS: Record<LayerType, typeof FiSun> = {
  day: FiSun,
  night: FiMoon,
  topo: LuMountain,
};

export type LayerSwitcherProps = {
  /** 現在選択中のレイヤー種別 */
  value: LayerType;
  /** レイヤー切替時に呼ばれるコールバック */
  onChange: (layerType: LayerType) => void;
};

/** 矢印キー押下時に選択を前後のレイヤーへ循環移動させる(role="radiogroup"のロービングtabindex契約)。 */
function getNextLayerType(current: LayerType, key: string): LayerType | undefined {
  const currentIndex = LAYER_TYPES.indexOf(current);
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    return LAYER_TYPES[(currentIndex + 1) % LAYER_TYPES.length];
  }
  if (key === 'ArrowLeft' || key === 'ArrowUp') {
    return LAYER_TYPES[(currentIndex - 1 + LAYER_TYPES.length) % LAYER_TYPES.length];
  }
  return undefined;
}

/** S-01 BottomNavBar。昼/夜/地形の3レイヤーを切り替える(排他選択)。 */
export const LayerSwitcher: FC<LayerSwitcherProps> = ({ value, onChange }) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const nextLayerType = getNextLayerType(value, event.key);
    if (nextLayerType !== undefined) {
      event.preventDefault();
      onChange(nextLayerType);
    }
  };

  const style = {
    group:
      'absolute bottom-l left-1/2 -translate-x-1/2 z-overlay flex gap-xs p-2xs border-token border-solid border-outline rounded-full bg-surface shadow-token',
    button:
      'flex items-center justify-center w-11 h-11 border-none rounded-full cursor-pointer transition-transform active:translate-x-token active:translate-y-token',
    buttonInactive: 'bg-transparent text-on-surface-variant',
    buttonActive: 'bg-primary text-on-primary scale-110 shadow-raised-token',
  };

  return (
    <div className={style.group} role="radiogroup" aria-label="レイヤー切替">
      {LAYER_TYPES.map((layerType) => {
        const isSelected = layerType === value;
        const Icon = LAYER_ICONS[layerType];
        const label = LAYER_LABELS[layerType];

        return (
          <button
            key={layerType}
            type="button"
            className={`${style.button} ${isSelected ? style.buttonActive : style.buttonInactive}`}
            role="radio"
            aria-checked={isSelected}
            aria-label={label}
            title={label}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(layerType)}
            onKeyDown={handleKeyDown}
          >
            <Icon aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
};
