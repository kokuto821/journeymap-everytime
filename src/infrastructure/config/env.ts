/** タイル画像・metadata.jsonを配信するR2バケットのベースURLを、Vite環境変数から取得する。 */
export const getR2BaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_R2_BASE_URL;
  if (!baseUrl) {
    throw new Error('環境変数 VITE_R2_BASE_URL が設定されていません');
  }
  return baseUrl;
};
