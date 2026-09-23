import type { Meta, StoryObj } from '@storybook/react-vite';
import { useThemeStore } from '../../state/useThemeStore';
import { ThemeSwitch } from '../ThemeSwitch';

const meta = {
  title: 'ui/ThemeSwitch',
  component: ThemeSwitch,
} satisfies Meta<typeof ThemeSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 初期表示。useThemeStoreの既定テーマ(シンプル)が選択された状態で表示する。 */
export const Default: Story = {};

/** retroテーマが選択された状態の見た目を確認する。decoratorでuseThemeStoreの状態をレンダー前に切り替える。 */
export const Retro: Story = {
  decorators: [
    (Story) => {
      useThemeStore.setState({ themeName: 'retro' });
      return <Story />;
    },
  ],
};

/** クリックでテーマが実際に切り替わる、操作可能な状態を表示する。 */
export const Interactive: Story = {
  decorators: [
    (Story) => {
      useThemeStore.setState({ themeName: 'simple' });
      return <Story />;
    },
  ],
};
