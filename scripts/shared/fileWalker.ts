import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * OS依存のパス区切り文字(Windowsの`\`等)を`/`区切りに正規化する。
 */
export const toPosixPath = (relativePath: string): string => relativePath.split(/[\\/]/).join('/');

/**
 * `rootDir`を再帰的に走査し、`rootDir`からの相対パス(ネイティブのパス区切り)の一覧を返す。
 */
const listAllFiles = (rootDir: string, currentDir: string): string[] => {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = path.join(currentDir, entry.name);

    // `Dirent.isDirectory()`はシンボリックリンクを解決しない(lstat相当)ため、
    // ディレクトリへのシンボリックリンクはfalseとなりファイル扱いになる。
    if (entry.isDirectory()) {
      return listAllFiles(rootDir, entryPath);
    }

    return [path.relative(rootDir, entryPath)];
  });
};

/**
 * `rootDir`を再帰的に走査し、ファイルのみを対象に`rootDir`からの相対パス
 * (ネイティブのパス区切り)の一覧を返す。
 */
export const walkFiles = (rootDir: string): string[] => listAllFiles(rootDir, rootDir);
