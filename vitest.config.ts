import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { createBabelPlugin } from './packages/cli/src/utils/babel-plugin/babel-plugin.utils';

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
      // exact-match regexes, so that e.g. '@xaendar/core' doesn't swallow '@xaendar/core/signals'
      alias: Object.entries(paths).map(([specifier, [path]]) => ({
        find: new RegExp(`^${specifier.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}$`),
        replacement: resolve(import.meta.dirname, `${path}.ts`)
      }))
    },
    test: {
      environment: 'node',
      maxWorkers: '50%',
      projects: [
        {
          extends: true,
          test: {
            name: 'packages',
            include: ['packages/**/*.spec.ts'],
            exclude: ['packages/directives/**', 'packages/forms/**', '**/node_modules/**']
          }
        },
        {
          // the built-in directives and the forms are written with decorators: Babel transpiles them, as the CLI does for a library
          extends: true,
          plugins: [createBabelPlugin()],
          test: {
            name: 'directives',
            include: ['packages/directives/**/*.spec.ts', 'packages/forms/**/*.spec.ts']
          }
        }
      ],
      coverage: {
        clean: true,
        include: ['packages/**/*.ts'],
        /*
          the build configurations of the packages are not library code; the directives written with decorators run in
          their specs, but Babel gives each `accessor` a setter that `@Property` replaces, never called, which v8 counts
          as uncovered lines of their source
        */
        exclude: ['packages/**/*.spec.ts', 'packages/*/vite.config.ts', 'packages/directives/src/directives/**/*.directive.ts', 'packages/forms/src/directives/**/*.directive.ts'],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100
        }
      }
    }
});
