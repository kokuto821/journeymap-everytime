import * as path from 'node:path';

// エクスポート出力先ディレクトリ(カレントディレクトリ=リポジトリルートからの相対パス)。
// export側(scripts/export/index.ts)とdeploy側(scripts/deploy/index.ts)の両方から参照される共通定数。
export const EXPORT_OUTPUT_ROOT_DIR = path.join('scripts', 'export', 'output');
