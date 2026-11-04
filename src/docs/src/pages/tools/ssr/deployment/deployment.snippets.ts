import type { SourceFile } from '../../../../core/sources/source-files.utils';

/**
 * The snippet `vite.config.ts` of a project rendering on the server without the CLI, shown by the page
 * tools/ssr/deployment and the API reference of build-tools.
 */
export const SSR_VITE_CONFIG: SourceFile = {
  name: 'vite.config.ts',
  lang: 'ts',
  code: `import babel from '@rolldown/plugin-babel';
import { xaendarPlugin } from '@xaendar/build-tools';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  plugins: [
    babel({
      presets: [{
        preset: () => ({ plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]] }),
        rolldown: { filter: { code: '@' } }
      }]
    }),
    // The entry is relative to the root of Vite: src/entry-server.ts
    xaendarPlugin({ ssr: { entry: 'entry-server.ts' } })
  ],
  build: {
    outDir: '../dist/client',
    emptyOutDir: true
  }
});

// The build of the server, run after the one of the browser:
//   vite build --ssr src/entry-server.ts --outDir dist/server`
};
