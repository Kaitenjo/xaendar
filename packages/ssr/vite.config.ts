import { defineConfig } from 'vite';
import getViteConfig from '../../vite-config.js';

export default defineConfig(getViteConfig('@xaendar/ssr', import.meta.dirname, {
  secondaryEntryPoints: {
    dom: 'src/dom/index.ts'
  }
}));
