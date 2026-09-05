import 'dotenv/config';
import { readJourneyMapFiles } from './infrastructure/journeyMapFileReader.ts';
import { writeExportFiles } from './infrastructure/exportFileWriter.ts';
import { EXPORT_OUTPUT_ROOT_DIR } from '../shared/outputRootDir.ts';

// F-004 エクスポートスクリプトのエントリファイル。
// journeyMapFileReader(走査)とexportFileWriter(タイル変換・waypoint変換・メタデータ出力)を
// 束ねて実行するオーケストレーション層。

// 出力先ディレクトリ(カレントディレクトリ=リポジトリルートからの相対パス)。
// .gitignoreで`scripts/export/output/`として除外済み。

// タイルズームピラミッドの最大ズームレベル。
// design.mdには具体的な数値の記載が無いため、Web地図の一般的な最大ズームレベルに近い値として
// 決め打ちする。JourneyMapのネイティブ解像度をこのズームレベルとして扱うだけで、
// Leaflet側は相対的なズーム差分で動作するため絶対値そのものに制約は無い。
const Z_MAX = 18;

/**
 * 環境変数`JOURNEYMAP_WORLD_DATA_PATH`からワールドディレクトリパスを取得する。
 * 未設定(undefinedまたは空文字)の場合はErrorを投げる。
 */
function getWorldRootDir(): string {
  const worldRootDir = process.env.JOURNEYMAP_WORLD_DATA_PATH;
  if (!worldRootDir) {
    throw new Error(
      '環境変数 JOURNEYMAP_WORLD_DATA_PATH が設定されていません(.env.example を参考に .env を作成してください)',
    );
  }

  return worldRootDir;
}

/**
 * JourneyMapローカルデータを走査し、タイル・waypoint・メタデータをエクスポートする。
 */
async function main(): Promise<void> {
  const worldRootDir = getWorldRootDir();
  const relativePaths = readJourneyMapFiles(worldRootDir);

  await writeExportFiles({
    relativePaths,
    worldRootDir,
    outputRootDir: EXPORT_OUTPUT_ROOT_DIR,
    zMax: Z_MAX,
  });

  console.log(`エクスポートが完了しました(処理ファイル数: ${relativePaths.length})`);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
