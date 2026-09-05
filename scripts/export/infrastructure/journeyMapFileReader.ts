import * as fs from 'node:fs';
import { isExportTarget } from '../domain/exportTargetPolicy.ts';
import { toPosixPath, walkFiles } from '../../shared/fileWalker.ts';

/**
 * ワールドセーブのローカルディレクトリ(`worldRootDir`)を再帰的に走査し、
 * `exportTargetPolicy.isExportTarget` によるエクスポート対象ファイルのみを
 * `worldRootDir` からの相対パス(`/`区切りに正規化済み)の配列として返す。
 */
export function readJourneyMapFiles(worldRootDir: string): string[] {
  if (!fs.existsSync(worldRootDir) || !fs.statSync(worldRootDir).isDirectory()) {
    throw new Error(`ワールドディレクトリが見つかりません: ${worldRootDir}`);
  }

  return walkFiles(worldRootDir).map(toPosixPath).filter(isExportTarget);
}
