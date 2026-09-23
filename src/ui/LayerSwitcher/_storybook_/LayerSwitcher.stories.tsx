import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FC, useState } from 'react';
import type { LayerType } from '../../../domain/layer/LayerType';
import { LayerSwitcher } from '../LayerSwitcher';

const meta = {
  title: 'ui/LayerSwitcher',
  component: LayerSwitcher,
} satisfies Meta<typeof LayerSwitcher>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 初期表示。昼レイヤーが選択された状態で表示する。 */
export const Default: Story = {
  args: {
    value: 'day',
    onChange: () => {},
  },
};

/** 夜間レイヤーが選択された状態で表示する。 */
export const NightSelected: Story = {
  args: {
    value: 'night',
    onChange: () => {},
  },
};

/** 地形レイヤーが選択された状態で表示する。 */
export const TopoSelected: Story = {
  args: {
    value: 'topo',
    onChange: () => {},
  },
};

/** バイオームレイヤーが選択された状態で表示する。 */
export const BiomeSelected: Story = {
  args: {
    value: 'biome',
    onChange: () => {},
  },
};

const InteractiveLayerSwitcher: FC = () => {
  const [value, setValue] = useState<LayerType>('day');
  return <LayerSwitcher value={value} onChange={setValue} />;
};

/** クリックでレイヤー選択が切り替わる、操作可能な状態を表示する。 */
export const Interactive: Story = {
  args: {
    value: 'day',
    onChange: () => {},
  },
  render: () => <InteractiveLayerSwitcher />,
};
