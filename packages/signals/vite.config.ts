import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import getViteConfig from '../../vite-config';

export default defineConfig(getViteConfig('@xendar/signals', __dirname, {
  plugins: [
    {
      name: 'types',
      writeBundle() {
        const content = readFileSync('../packages/signals/src/global.d.ts', 'utf-8');
        const dtsContent = readFileSync('../dist/@xendar/signals/xendar-signals.es.d.ts', 'utf-8');
        writeFileSync('../dist/@xendar/signals/xendar-signals.es.d.ts', `${content}\n\n${dtsContent}`);
      }
    }
  ]
}));
