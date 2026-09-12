import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';
// eslint-plugin-importはpeerDependenciesがESLint9以下までのため、ESLint10対応のimport-xを採用
import importX from 'eslint-plugin-import-x';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier/flat';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      unicorn,
      'import-x': importX,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-magic-numbers': 'error',
      'func-style': ['error', 'expression'],
      'import-x/no-default-export': 'error',
    },
  },
  {
    // コンポーネントファイルはPascalCase
    files: ['**/*.tsx'],
    plugins: { unicorn },
    rules: {
      'unicorn/filename-case': ['error', { case: 'pascalCase', ignore: [/^_test_$/, /^src$/, /^map-view$/] }],
    },
  },
  {
    // hooks/utilsファイルはcamelCase
    files: ['**/*.ts'],
    plugins: { unicorn },
    rules: {
      'unicorn/filename-case': ['error', { case: 'camelCase', ignore: [/^_test_$/, /^src$/, /^map-view$/] }],
    },
  },
  {
    // domain配下の型定義ファイルはPascalCase運用のため対象外(Typesサフィックス規約への是正は別課題)
    files: ['src/domain/**/*.ts'],
    plugins: { unicorn },
    rules: {
      'unicorn/filename-case': 'off',
    },
  },
  {
    // pageコンポーネント(default export前提)はimport-x/no-default-exportの対象外。
    // 現時点でpagesディレクトリは存在しないが、将来の追加に備えた除外設定
    files: ['src/**/pages/**/*.{ts,tsx}'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },
  {
    // ローカル実行スクリプト(F-004/F-005)とNode上で動く設定ファイルはNode環境
    files: ['scripts/**/*.ts', '*.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Vite/Vitest設定ファイルはツール仕様上default exportが必須
    files: ['*.config.ts'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },
  prettierConfig,
]);
