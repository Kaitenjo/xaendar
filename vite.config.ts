import path from 'path';
import { defineConfig } from 'vite';

console.log(path.resolve(__dirname, 'packages/signals/src'));

export default defineConfig({
  root: 'src',
  server: {
    open: true,
    port: 4200
  },
  resolve: {
    alias: {
      '@xaendar/common': path.resolve(__dirname, 'packages/common/src/public-api.ts'),
      '@xaendar/signals': path.resolve(__dirname, 'packages/signals/src/public-api.ts'),
    }
  }
});