import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { XaendarSsrConfig } from '../../types/xaendar-ssr-config.type';
import type { XaendarConfig } from '../../types/xaendar-config.type';
import type { XaendarProject } from '../../types/xaendar-project.type';

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
 * Reads the project holding a directory: the nearest `xaendar.json`, walking up from it, as the commands working in any
 * folder of a project (or of a workspace) find it.
 *
 * @param fromDir - The directory.
 * @returns The project, `undefined` when no `xaendar.json` is found up to the root of the file system.
 */
export function readProject(fromDir: string): XaendarProject | undefined {
  const configPath = findXaendarConfigPath(resolve(fromDir));
  if (!configPath) {
    return undefined;
  }

  return { dir: dirname(configPath), configPath, config: JSON.parse(readFileSync(configPath, 'utf-8')) };
}

/**
 * Finds the nearest `xaendar.json`, walking up from a directory to the root of the file system.
 *
 * @param dir - Absolute path of the directory to start from.
 * @returns The path of the file, `undefined` if none is found.
 */
export function findXaendarConfigPath(dir: string): string | undefined {
  while (true) {
    const candidate = resolve(dir, 'xaendar.json');
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(dir);
    if (parent === dir) {
      return undefined;
    }

    dir = parent;
  }
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
