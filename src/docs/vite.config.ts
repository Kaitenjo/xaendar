import path from 'node:path';
import { defineConfig } from 'vite';

const dirName = import.meta.dirname;
const monorepoRoot = path.resolve(dirName, '../..');

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    emptyOutDir: true,
    outDir: '../dist/client'
  },
  resolve: {
    alias: [
      { find: /^@xaendar\/common$/, replacement: path.resolve(monorepoRoot, 'packages/common/src/public-api.ts') },
      { find: /^@xaendar\/core$/, replacement: path.resolve(monorepoRoot, 'packages/core/src/public-api.ts') },
      { find: /^@xaendar\/core\/signals$/, replacement: path.resolve(monorepoRoot, 'packages/core/src/signals/index.ts') },
      { find: /^@xaendar\/core\/testing$/, replacement: path.resolve(monorepoRoot, 'packages/core/src/testing/index.ts') },
      { find: /^@xaendar\/ssr$/, replacement: path.resolve(monorepoRoot, 'packages/ssr/src/public-api') },
      { find: /^@xaendar\/ssr\/dom$/, replacement: path.resolve(monorepoRoot, 'packages/ssr/src/dom/index') },
      { find: /^@xaendar\/signals$/, replacement: path.resolve(monorepoRoot, 'packages/signals/src/public-api.ts') },
      { find: /^@xaendar\/types$/, replacement: path.resolve(monorepoRoot, 'packages/types/src/public-api.ts') },
    ]
  },
  server: {
    open: true,
    port: 4200,
    fs: {
      allow: [monorepoRoot]
    },
    forwardConsole: false
  }
});