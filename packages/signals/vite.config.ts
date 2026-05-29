import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import getViteConfig from '../../vite-config';

export default defineConfig(getViteConfig('@xaendar/signals', __dirname, {
  plugins: [
    {
      name: 'types',
      writeBundle() {
        const pathDeclaration = '../dist/@xaendar/signals/dist/xaendar-signals.es.d.ts';
        const content = readFileSync('../packages/signals/src/globals.d.ts', 'utf-8');
        const dtsContent = readFileSync(pathDeclaration, 'utf-8');
        writeFileSync(pathDeclaration, `${content}\n\n${dtsContent}`);
      }
    }
  ]
}));
