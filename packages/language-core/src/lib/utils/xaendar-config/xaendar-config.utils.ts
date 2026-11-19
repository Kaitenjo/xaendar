import { dirname } from 'node:path';
import { findConfigFile, readConfigFile, sys } from 'typescript';
import type { XaendarConfigFile } from '../../types/xaendar-config-file.type';
import type { XaendarLibraryConfig } from '../../types/xaendar-library-config.type';
import { normalizeFileName, resolvePosixPath } from '../path/path.utils';

/**
 * Reads the patterns of the custom elements of other libraries (`"customElements": ["sl-*"]`) from the nearest
 * `xaendar.json`, walking up from a directory: the patterns the CLI passes to the compiler. A directory of a library of
 * the workspace (`libs`) reads the ones of the library.
 *
 * @param fromDir - Directory to start searching for `xaendar.json` from, typically the directory of the template.
 * @returns The patterns, `undefined` when the file cannot be found or read, or has no such field.
 */
export function readCustomElements(fromDir: string): readonly string[] | undefined {
  const config = readConfig(fromDir);
  const library = config && findLibrary(config, fromDir);
  return library ? library.customElements : config?.config.customElements;
}

/**
 * Reads whether the project renders on the server from the nearest `xaendar.json`, walking up from a directory. A
 * directory of a library of the workspace (`libs`) reads whether the library does.
 *
 * @param fromDir - Directory to start searching for `xaendar.json` from, typically the directory of the template.
 * @returns Whether the file declares `ssr`, `undefined` when the file cannot be found or read: the project may configure
 *   the plugin by itself, so where it renders is not known.
 */
export function readSsr(fromDir: string): boolean | undefined {
  const config = readConfig(fromDir);
  if (!config) {
    return undefined;
  }

  const library = findLibrary(config, fromDir);
  return library ? library.ssr === true : !!config.config.ssr;
}

/**
 * Reads whether the templates warn about the events their elements do not declare (`"strictEvents": false` turns the
 * warning off) from the nearest `xaendar.json`, walking up from a directory. A directory of a library of the workspace
 * (`libs`) reads the option of the library, the one of the project when the library does not declare it.
 *
 * @param fromDir - Directory to start searching for `xaendar.json` from, typically the directory of the template.
 * @returns `false` when the option is off, `true` otherwise, also when the file cannot be found or read.
 */
export function readStrictEvents(fromDir: string): boolean {
  const config = readConfig(fromDir);
  const library = config && findLibrary(config, fromDir);
  return (library?.strictEvents ?? config?.config.strictEvents) !== false;
}

/**
 * Reads the nearest `xaendar.json`, walking up from a directory.
 *
 * @param fromDir - Directory to start searching for `xaendar.json` from.
 * @returns The content of the file and its directory, `undefined` when it cannot be found or read.
 */
function readConfig(fromDir: string): XaendarConfigFile | undefined {
  const configPath = findConfigFile(fromDir, sys.fileExists, 'xaendar.json');
  if (configPath) {
    const { config, error } = readConfigFile(configPath, sys.readFile);
    return error ? undefined : { config, dir: dirname(configPath) };
  }
}

/**
 * Finds the library of the workspace holding a directory.
 *
 * @param config - The `xaendar.json` of the workspace, and its directory.
 * @param fromDir - The directory.
 * @returns The library, `undefined` when the directory belongs to none.
 */
function findLibrary({ config, dir }: XaendarConfigFile, fromDir: string): XaendarLibraryConfig | undefined {
  if (!config.libs) {
    return undefined;
  }

  const path = `${normalizeFileName(fromDir)}/`;
  return Object.values(config.libs).find(({ root }) => path.startsWith(`${normalizeFileName(resolvePosixPath(dir, root))}/`));
}
