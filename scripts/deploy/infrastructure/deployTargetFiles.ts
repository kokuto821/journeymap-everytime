import * as fs from 'node:fs';
import * as path from 'node:path';
import { toPosixPath, walkFiles } from '../../shared/fileWalker.ts';

export type DeployTargetFile = { localFilePath: string; r2ObjectKey: string };

/**
 * エクスポート出力ルートディレクトリ(`outputRootDir`)を再帰的に走査し、
 * ファイルのみを対象に、ローカルの絶対パスとR2オブジェクトキー(`outputRootDir`からの
 * 相対パスを`/`区切りに正規化したもの)の組を返す。
 */
export function listDeployTargetFiles(outputRootDir: string): DeployTargetFile[] {
  if (!fs.existsSync(outputRootDir) || !fs.statSync(outputRootDir).isDirectory()) {
    throw new Error(`デプロイ対象の出力ルートディレクトリが見つかりません: ${outputRootDir}`);
  }

  return walkFiles(outputRootDir).map((relativePath) => ({
    localFilePath: path.join(outputRootDir, relativePath),
    r2ObjectKey: toPosixPath(relativePath),
  }));
}
