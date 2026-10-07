import babel from '@rolldown/plugin-babel';
import { xaendarPlugin } from '@xaendar/build-tools';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  plugins: [
    // 1. Transpiles the standard (2023-11) decorators: @WebComponent, @Property, @Event, ...
    babel({
      presets: [{
        preset: () => ({ plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]] }),
        rolldown: { filter: { code: '@' } }
      }]
    }),
    // 2. Compiles the templates and the styles, and type-checks the templates.
    //    It must come after the decorators transform.
    xaendarPlugin()
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
