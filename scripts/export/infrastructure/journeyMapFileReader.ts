import * as fs from 'node:fs';
import * as path from 'node:path';
import { isExportTarget } from '../domain/exportTargetPolicy.ts';

/**
 * OS依存のパス区切り文字(Windowsの`\`等)を`/`区切りに正規化する。
 */
export function toPosixPath(relativePath: string): string {
  return relativePath.split(/[\\/]/).join('/');
}

/**
 * `worldRootDir`を再帰的に走査し、`worldRootDir`からの相対パスの一覧を返す。
 */
function listAllFiles(worldRootDir: string, currentDir: string): string[] {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = path.join(currentDir, entry.name);

    // `Dirent.isDirectory()`はシンボリックリンクを解決しない(lstat相当)ため、
    // ディレクトリへのシンボリックリンクはfalseとなりファイル扱いになる。
    // ワールドセーブディレクトリ配下にシンボリックリンクが存在する運用は
    // 想定していないため、この非解決挙動をそのまま許容する。
    if (entry.isDirectory()) {
      return listAllFiles(worldRootDir, entryPath);
    }

    return [toPosixPath(path.relative(worldRootDir, entryPath))];
  });
}

/**
 * ワールドセーブのローカルディレクトリ(`worldRootDir`)を再帰的に走査し、
 * `exportTargetPolicy.isExportTarget` によるエクスポート対象ファイルのみを
 * `worldRootDir` からの相対パス(`/`区切りに正規化済み)の配列として返す。
 */
export function readJourneyMapFiles(worldRootDir: string): string[] {
  return listAllFiles(worldRootDir, worldRootDir).filter((relativePath) =>
    isExportTarget(relativePath),
  );
}
