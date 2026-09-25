import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/output/**',
      '**/.git/**',
      '**/*.config.*',
      'eslint.config.mjs'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,js,mjs}'],
    ignores: ['**/*.config.*', 'eslint.config.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'no-console': 'off',
      'no-case-declarations': 'off',
      'no-fallthrough': 'off',
      'no-unused-vars': 'off',
      'no-useless-escape': 'off',
      quotes: ['error', 'single', { avoidEscape: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-require-imports': 'off'
    }
  }
);
