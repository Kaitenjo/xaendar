import path from 'node:path';
import { defineConfig } from 'vite';

/*
  The Xaendar page of the framework comparison, built from the sources of the packages of this repository, as the
  documentation site is. The build goes into the public folder of the site, which shows it in an iframe.
*/
const packages = path.resolve(import.meta.dirname, '../../../../packages');

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: false,
  build: {
    emptyOutDir: true,
    outDir: '../../../public/comparison/xaendar'
  },
  resolve: {
    alias: [
      { find: /^@xaendar\/common$/, replacement: path.join(packages, 'common/src/public-api.ts') },
      { find: /^@xaendar\/core$/, replacement: path.join(packages, 'core/src/public-api.ts') },
      { find: /^@xaendar\/core\/signals$/, replacement: path.join(packages, 'core/src/signals/index.ts') },
      { find: /^@xaendar\/internals$/, replacement: path.join(packages, 'internals/src/public-api.ts') },
      { find: /^@xaendar\/signals$/, replacement: path.join(packages, 'signals/src/public-api.ts') },
      { find: /^@xaendar\/types$/, replacement: path.join(packages, 'types/src/public-api.ts') }
    ]
  },
  server: {
    fs: {
      allow: [path.resolve(packages, '..')]
    }
  }
});
