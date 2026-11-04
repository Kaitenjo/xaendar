import { readdirSync } from 'node:fs';
import type { ModuleEntry } from '../../types/module-entry.type';

/**
 * The files that are not modules to import: declarations, specs and tests.
 */
export const NOT_IMPORTABLE = /\.(d|spec|test)\.ts$/;

/**
 * Lists what a module path can continue with in a directory: its TypeScript modules, declaration files, specs and
 * tests excluded, and its subdirectories, hidden ones and `node_modules` excluded.
 *
 * @param directory - The path of the directory.
 * @returns The entries of the directory, none if it cannot be read.
 */
export function listModuleEntries(directory: string): ModuleEntry[] {
  try {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry): ModuleEntry[] => {
      if (entry.isDirectory()) {
        return entry.name.startsWith('.') || entry.name === 'node_modules' ? [] : [{ name: `${entry.name}/`, isDirectory: true }];
      }

      return entry.name.endsWith('.ts') && !NOT_IMPORTABLE.test(entry.name) ? [{ name: entry.name.slice(0, -'.ts'.length), isDirectory: false }] : [];
    });
  } catch {
    return [];
  }
}
