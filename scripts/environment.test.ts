import { describe, expect, test } from 'vitest';

// scripts/配下がjsdomではなくNode環境で実行されることを保証するスモークテスト。
// F-004(エクスポート)・F-005(デプロイ)はNode APIに依存するため、
// 環境設定が壊れた場合にここで検知する。
describe('scripts のテスト実行環境', () => {
  test('Node環境で実行される(ブラウザのグローバルが存在しない)', () => {
    expect('document' in globalThis).toBe(false);
  });

  test('Node組み込みモジュールを利用できる', async () => {
    const { join } = await import('node:path');

    expect(join('a', 'b')).toBe('a/b');
  });
});
