import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

type Tsconfig = {
  compilerOptions: {
    paths: Record<string, [string]>,
  },
}

// reuse tsconfig paths as the single source of truth for @xaendar/* aliases
const { compilerOptions: { paths } }: Tsconfig = JSON.parse(readFileSync(resolve(import.meta.dirname, 'tsconfig.json'), 'utf-8'));

export default defineConfig({
    root: import.meta.dirname,
    resolve: {
      alias: Object.fromEntries(
        Object.entries(paths).map(([specifier, [path]]) => [specifier, resolve(import.meta.dirname, `${path}.ts`)])
      )
    },
    test: {
      environment: 'node',
      include: ['packages/**/*.spec.ts'],
      maxWorkers: '50%',
      coverage: {
        clean: true,
        include: ['packages/**/*.ts'],
        exclude: ['packages/**/*.spec.ts'],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100
        }
      }
    }
});

