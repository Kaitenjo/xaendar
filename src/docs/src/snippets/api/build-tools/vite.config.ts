import babel from '@rolldown/plugin-babel';
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
    // The Shoelace components and an element written without Xaendar: the templates use them like native elements
    xaendarPlugin({ customElements: ['sl-*', 'vanilla-stars'] })
  ]
});
