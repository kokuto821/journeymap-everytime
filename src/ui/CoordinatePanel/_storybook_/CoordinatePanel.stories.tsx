import type { Meta, StoryObj } from '@storybook/react-vite';
import { createWorldCoordinate } from '../../../domain/coordinate/WorldCoordinate';
import { CoordinatePanel } from '../CoordinatePanel';

const meta = {
  title: 'ui/CoordinatePanel',
  component: CoordinatePanel,
} satisfies Meta<typeof CoordinatePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 未クリック状態。プレースホルダ文言が表示され、コピーボタンはdisabled。 */
export const Placeholder: Story = {
  args: {
    worldCoordinate: null,
  },
};

/** 座標クリック後の表示。「X, Z」形式で座標が表示され、コピーアイコンボタンが押下可能。 */
export const WithCoordinate: Story = {
  args: {
    worldCoordinate: createWorldCoordinate({ x: 123, z: -456 }),
  },
};
