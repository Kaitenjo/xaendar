import { defineConfig } from 'vite';
import getViteConfig from '../../vite-config';

export default defineConfig(getViteConfig('@xendar/compiler', __dirname));
