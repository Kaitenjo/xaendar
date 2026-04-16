import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import getViteConfig from '../../vite-config';

export default defineConfig(getViteConfig('@xaendar/signals', __dirname, {
  plugins: [
    {
      name: 'types',
      writeBundle() {
        const content = readFileSync('../packages/signals/src/globals.d.ts', 'utf-8');
        const dtsContent = readFileSync('../dist/@xaendar/signals/xaendar-signals.es.d.ts', 'utf-8');
        writeFileSync('../dist/@xaendar/signals/xaendar-signals.es.d.ts', `${content}\n\n${dtsContent}`);
      }
    }
  ]
}));
