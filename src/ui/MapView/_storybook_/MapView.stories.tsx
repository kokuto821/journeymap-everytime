import type { Meta, StoryObj } from '@storybook/react-vite';
import { MapView } from '../MapView';

// MapViewはpropsを持たず、metadata.jsonの取得結果(loading/loaded/error)に応じて表示を切り替える。
// コンポーネント自体がgetR2BaseUrl()/fetchTileMetadata()をuseEffect内で直接呼ぶ構造で
// props注入によるモックができないため、各storyのdecoratorでglobalThis.fetchを差し替えて
// Loading/Error/Successの3状態を個別に再現する。

/** metadata.json取得を解決させないため、常にpendingのままのPromiseを返すfetchスタブ。Loading表示の確認用。 */
const stubPendingFetch = (): void => {
  globalThis.fetch = (() => new Promise<Response>(() => {})) as typeof fetch;
};

/** metadata.json取得が失敗する(reject)ことを再現するfetchスタブ。Error表示の確認用。 */
const stubRejectingFetch = (): void => {
  globalThis.fetch = (() => Promise.reject(new Error('network error'))) as typeof fetch;
};

/** metadata.json取得が成功することを再現するfetchスタブ。Success(タイル表示)の確認用。 */
const stubResolvingFetch = (): void => {
  const metadata = { zMax: 4, minZoom: 0, tileSize: 512, layers: {} };
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response(JSON.stringify(metadata), { status: 200 }),
    )) as typeof fetch;
};

const meta = {
  title: 'ui/MapView',
  component: MapView,
} satisfies Meta<typeof MapView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** metadata.json取得中のローディング表示(role="status")。 */
export const Loading: Story = {
  decorators: [
    (Story) => {
      stubPendingFetch();
      return <Story />;
    },
  ],
};

/** metadata.json取得に失敗した場合のエラー表示(role="alert")。 */
export const FetchError: Story = {
  decorators: [
    (Story) => {
      stubRejectingFetch();
      return <Story />;
    },
  ],
};

/** metadata.json取得に成功し、地図(タイル)が表示される状態。 */
export const Success: Story = {
  decorators: [
    (Story) => {
      stubResolvingFetch();
      return <Story />;
    },
  ],
};
