import path from 'node:path';
import { defineConfig } from 'vite';

const dirName = import.meta.dirname;
const monorepoRoot = path.resolve(dirName, '../..');

export default defineConfig({
  root: 'src',
  resolve: {
    alias: {
      '@xaendar/common': path.resolve(monorepoRoot, 'packages/common/src/public-api.ts'),
      '@xaendar/core': path.resolve(monorepoRoot, 'packages/core/src/public-api.ts'),
      '@xaendar/core/signals': path.resolve(monorepoRoot, 'packages/core/signals/index.ts'),
      '@xaendar/signals': path.resolve(monorepoRoot, 'packages/signals/src/public-api.ts'),
      '@xaendar/types': path.resolve(monorepoRoot, 'packages/types/src/public-api.ts'),
    }
  },
  server: {
    open: true,
    port: 4200,
    fs: {
      allow: [monorepoRoot]
    }
  }
});