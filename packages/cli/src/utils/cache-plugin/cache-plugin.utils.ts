import { dirname, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { findXaendarConfigPath } from '../xaendar-config/xaendar-config.utils';

/**
 * Finds the `node_modules` of the project holding a directory: the one next to the nearest `xaendar.json`, which in a
 * workspace is the one of the workspace, also from the folder of one of its libraries; else the one of the directory.
 * The caches of Vite and of Vitest go there, so that a workspace has a single `node_modules`: a library has a
 * `package.json` of its own, next to which Vite and Vitest would create another one.
 *
 * @param fromDir - The directory, absolute.
 * @returns The path of the `node_modules`, which may not exist yet.
 */
export function findModulesDir(fromDir: string): string {
  const configPath = findXaendarConfigPath(fromDir);
  return resolve(configPath ? dirname(configPath) : fromDir, 'node_modules');
}

/**
 * Creates the plugin putting the cache of Vite (`cacheDir`, where Vitest keeps the results of the tests too) into the
 * `node_modules` of the project (see {@link findModulesDir}), unless the configuration sets one.
 *
 * @param fromDir - The directory the project is found from, the working directory by default.
 * @returns The plugin.
 */
export function createCachePlugin(fromDir: string = process.cwd()): Plugin {
  const cacheDir = resolve(findModulesDir(fromDir), '.vite');
  return {
    name: 'xaendar:cache',
    config: config => config.cacheDir ? undefined : { cacheDir }
  };
}
