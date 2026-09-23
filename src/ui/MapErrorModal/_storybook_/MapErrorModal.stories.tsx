import type { Meta, StoryObj } from '@storybook/react-vite';
import { MapErrorModal } from '../MapErrorModal';

const meta = {
  title: 'ui/MapErrorModal',
  component: MapErrorModal,
} satisfies Meta<typeof MapErrorModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 地図データ読み込み失敗時の表示。 */
export const Default: Story = {
  args: {
    onRetry: () => {},
  },
};
