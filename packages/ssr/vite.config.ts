import { defineConfig } from 'vite';
import getViteConfig from '../../vite-config.js';

export default defineConfig(getViteConfig('@xaendar/ssr', import.meta.dirname, {
  secondaryEntryPoints: {
    dom: 'src/dom/index.ts'
  },
  typeCheckFiles: ['../core/src/globals.d.ts', '../core/src/window.d.ts']
}));
