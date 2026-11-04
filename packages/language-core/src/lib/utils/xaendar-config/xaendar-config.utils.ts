import { findConfigFile, readConfigFile, sys } from 'typescript';
import type { XaendarConfig } from '../../types/xaendar-config.type';

/**
 * Reads the patterns of the custom elements of other libraries (`"customElements": ["sl-*"]`) from the nearest
 * `xaendar.json`, walking up from a directory: the patterns the CLI passes to the compiler.
 *
 * @param fromDir - Directory to start searching for `xaendar.json` from, typically the directory of the template.
 * @returns The patterns, `undefined` when the file cannot be found or read, or has no such field.
 */
export function readCustomElements(fromDir: string): readonly string[] | undefined {
  return readConfig(fromDir)?.customElements;
}

/**
 * Reads whether the project renders on the server from the nearest `xaendar.json`, walking up from a directory.
 *
 * @param fromDir - Directory to start searching for `xaendar.json` from, typically the directory of the template.
 * @returns Whether the file declares `ssr`, `undefined` when the file cannot be found or read: the project may configure
 *   the plugin by itself, so where it renders is not known.
 */
export function readSsr(fromDir: string): boolean | undefined {
  const config = readConfig(fromDir);
  return config && !!config.ssr;
}

/**
 * Reads the nearest `xaendar.json`, walking up from a directory.
 *
 * @param fromDir - Directory to start searching for `xaendar.json` from.
 * @returns The content of the file, `undefined` when it cannot be found or read.
 */
function readConfig(fromDir: string): XaendarConfig | undefined {
  const configPath = findConfigFile(fromDir, sys.fileExists, 'xaendar.json');
  if (configPath) {
    const { config, error } = readConfigFile(configPath, sys.readFile);
    return error ? undefined : config;
  }
}
