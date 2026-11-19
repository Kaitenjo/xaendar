import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `vite.config.ts` of a host app that compiles the components itself, shown by the page
 * tools/integrations. The other files of the page are read from the demo applications themselves.
 */
export const INTEGRATIONS_HOST_VITE_CONFIG: SourceFile = {
  name: 'vite.config.ts',
  lang: 'ts',
  code: `import babel from '@rolldown/plugin-babel';
import react from '@vitejs/plugin-react';
import { xaendarPlugin } from '@xaendar/build-tools';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    // The plugin of the host framework, whatever it is
    react(),
    // The decorators of Xaendar, in the Xaendar files only: the \`id\` filter keeps Babel away
    // from the files of the host
    babel({
      presets: [{
        preset: () => ({ plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]] }),
        rolldown: { filter: { id: '**/*.xd.component.ts' } }
      }]
    }),
    // Compiles the templates and the styles; it must come after the decorators transform
    xaendarPlugin()
  ]
});`
};
