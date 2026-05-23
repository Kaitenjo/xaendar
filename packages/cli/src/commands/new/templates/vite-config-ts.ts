/**
 * Generates the content of the project `vite.config.ts`.
 *
 * @returns The formatted TypeScript source string.
 */
export function viteConfigTs(): string {
  return `import { defineConfig } from 'vite';
import { xaendarPlugin } from '@xaendar/build-tools';

export default defineConfig({
  root: 'src',
  server: {
    open: true,
    port: 4200
  },
  plugins: [xaendarPlugin()],
});
`;
}
