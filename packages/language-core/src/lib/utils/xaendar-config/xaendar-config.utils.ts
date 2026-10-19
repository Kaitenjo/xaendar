import { findConfigFile, readConfigFile, sys } from 'typescript';

/**
 * Reads the patterns of the custom elements of other libraries (`"customElements": ["sl-*"]`) from the nearest
 * `xaendar.json`, walking up from a directory: the patterns the CLI passes to the compiler.
 *
 * @param fromDir - Directory to start searching for `xaendar.json` from, typically the directory of the template.
 * @returns The patterns, `undefined` when the file cannot be found or read, or has no such field.
 */
export function readCustomElements(fromDir: string): readonly string[] | undefined {
  const configPath = findConfigFile(fromDir, sys.fileExists, 'xaendar.json');
  if (configPath) {
    const config: { customElements?: readonly string[] } = readConfigFile(configPath, sys.readFile).config;
    return config?.customElements;
  }
}
