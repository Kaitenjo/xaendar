import { dirname } from 'node:path';
import { findConfigFile, parseJsonConfigFileContent, readConfigFile, sys } from 'typescript';
import type { ParsedCommandLine } from 'typescript';

/**
 * Loads the `tsconfig.json` applicable to the given directory, using
 * TypeScript's standard config file resolution (`findConfigFile` walks up
 * parent directories). Falls back to empty options and no files if no config
 * file is found, rather than throwing — type checking simply runs with
 * default settings in that case.
 *
 * @param fromDir - Directory to start searching for `tsconfig.json` from,
 *   typically the project root or the directory of the component file being
 *   transformed. Must be a file-system path, not a `file://` URL.
 * @returns The resolved `compilerOptions` and the project files matched by the
 *   config's `files`/`include`/`exclude`. The latter must be part of the
 *   LanguageService program so that ambient declarations (e.g. a
 *   `globals.d.ts` declaring the global `Signal` namespace) are visible to
 *   the type-check shims.
 */
export function loadTsConfig(fromDir: string): Pick<ParsedCommandLine, 'options' | 'fileNames'> {
  const configPath = findConfigFile(fromDir, sys.fileExists, 'tsconfig.json');
  if (!configPath) {
    return { options: {}, fileNames: [] };
  }

  const configFile = readConfigFile(configPath, sys.readFile);
  const parsed = parseJsonConfigFileContent(configFile.config, sys, dirname(configPath));
  return { options: parsed.options, fileNames: parsed.fileNames };
}
