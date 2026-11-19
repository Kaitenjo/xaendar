import babel from '@rolldown/plugin-babel';
import { xaendarPlugin } from '@xaendar/build-tools';
import { defineConfig } from 'vite';

/*
  Builds the Xaendar component as one ES module, with the framework bundled into it: the applications that
  embed it only import this file, and need no Xaendar dependency of their own.
*/
export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: 'src/public-api.ts',
      fileName: 'qty-picker',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        codeSplitting: false
      }
    }
  },
  plugins: [
    babel({
      presets: [
        {
          preset: () => ({
            plugins: [
              [
                '@babel/plugin-proposal-decorators',
                { version: '2023-11' }
              ]
            ]
          }),
          rolldown: {
            filter: {
              id: '**/*.xd.component.ts'
            }
          }
        }
      ]
    }),
    xaendarPlugin()
  ]
});
