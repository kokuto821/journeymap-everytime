import { describe, expect, test } from 'vitest';

// scripts/配下がjsdomではなくNode環境で実行されることを保証するスモークテスト。
// F-004(エクスポート)・F-005(デプロイ)はNode APIに依存するため、
// 環境設定が壊れた場合にここで検知する。
describe('scripts のテスト実行環境', () => {
  test('scripts配下のテストを実行したらブラウザのグローバルが存在しない', () => {
    // Act
    const hasDocument = 'document' in globalThis;

    // Assert
    expect(hasDocument).toBe(false);
  });

  test('Node組み込みモジュールをimportしたら利用できる', async () => {
    // Arrange
    const { join } = await import('node:path');

    // Act
    const joined = join('a', 'b');

    // Assert
    expect(joined).toBe('a/b');
  });
});
