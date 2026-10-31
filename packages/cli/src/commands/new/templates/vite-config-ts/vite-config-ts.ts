import type { ProjectRendering } from '../../types/project-rendering.type';

/**
 * Generates the content of the project `vite.config.ts`.
 *
 * The application of the browser is built into the folder of the rendering of the project: `dist/client` for a project
 * rendering its pages on the server, next to the build of the server, in `dist/server`.
 *
 * @param rendering - Where the project renders its pages.
 * @returns The formatted TypeScript source string.
 */
export function viteConfigTs(rendering: Pick<ProjectRendering, 'outDir'>): string {
  return `import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    emptyOutDir: true,
    outDir: '${rendering.outDir}'
  },
  server: {
    open: true,
    port: 4200,
    forwardConsole: false
  }
});`;
}
