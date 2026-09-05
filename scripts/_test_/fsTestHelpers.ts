import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * `rootDir` を起点に、`/`区切りの相対パスで空ファイルを1件作成する。
 * 親ディレクトリが無ければ再帰的に作成する。
 */
export function createFile(rootDir: string, relativePath: string): void {
  const fullPath = path.join(rootDir, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, '');
}
