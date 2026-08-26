import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Vite本体の設定(vite.config.ts)とは分離し、テスト実行専用の設定として持つ。
// フロントエンド(src/)とローカルスクリプト(scripts/)は実行環境が異なるため、
// projectsで環境を分けたうえで`npm run test`から一括実行できるようにしている。
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'app',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
      {
        test: {
          name: 'scripts',
          environment: 'node',
          include: ['scripts/**/*.test.ts'],
        },
      },
    ],
  },
});
