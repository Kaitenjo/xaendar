import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { XaendarSsrConfig } from '../../types/xaendar-ssr-config.type';
import type { XaendarConfig } from '../../types/xaendar-config.type';

/**
 * The comment of `index.html` the HTML rendered on the server replaces, the one the dev server of the Vite plugin
 * replaces too: the generated `index.html` and `server.ts` and `xd prerender` write the page there.
 */
export const SSR_OUTLET = '<!--xd-ssr-->';

/**
 * Reads the configuration of the project in the working directory.
 *
 * @returns The configuration, `undefined` when the project has no `xaendar.json`.
 */
export function readXaendarConfig(): XaendarConfig | undefined {
  const path = resolve(process.cwd(), 'xaendar.json');
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf-8')) : undefined;
}

/**
 * Resolves the paths of the rendering on the server of the project in the working directory.
 *
 * Exits the process with code `1` when the entry is written with the extension of its module.
 *
 * @param ssr - The rendering on the server, as `xaendar.json` declares it.
 * @returns The absolute path of the entry, of the folder of the build of the server, and of the entry built there.
 */
export function resolveSsrPaths({ entry, outDir = 'dist/server' }: XaendarSsrConfig): { entry: string, outDir: string, builtEntry: string } {
  if (/\.[cm]?[jt]sx?$/.test(entry)) {
    console.error(`✖  Invalid ssr entry "${entry}" in xaendar.json: write it without extension.`);
    process.exit(1);
  }

  const absoluteOutDir = resolve(process.cwd(), outDir);
  const name = entry.slice(Math.max(entry.lastIndexOf('/'), entry.lastIndexOf('\\')) + 1);
  return {
    entry: resolve(process.cwd(), entry),
    outDir: absoluteOutDir,
    builtEntry: resolve(absoluteOutDir, `${name}.js`)
  };
}
