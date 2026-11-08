import { defineConfig } from 'vite';
import getViteConfig from '../../vite-config.js';

export default defineConfig(getViteConfig('@xaendar/signals', import.meta.dirname));
