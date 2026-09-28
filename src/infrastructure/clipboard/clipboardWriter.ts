/** 文字列をクリップボードへ書き込む。非対応環境・書き込み失敗時は例外を投げず失敗を返す。 */
export const writeToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (!navigator.clipboard) {
      return false;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
