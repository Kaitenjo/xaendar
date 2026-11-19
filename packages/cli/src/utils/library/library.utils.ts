import { isValidCustomElementName } from '@xaendar/common';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import type { ResolvedLibrary } from '../../types/resolved-library.type';
import type { WorkspaceLibrary } from '../../types/workspace-library.type';
import type { XaendarConfig } from '../../types/xaendar-config.type';
import type { XaendarLibraryConfig } from '../../types/xaendar-library-config.type';
import type { XaendarProject } from '../../types/xaendar-project.type';

/**
 * The folder of a workspace holding its libraries, each one in a folder of its own.
 */
export const LIBRARIES_FOLDER = 'libraries';

/**
 * The module exporting what a library publishes, relative to its folder, when its `libs` entry names none.
 */
export const DEFAULT_LIBRARY_ENTRY = 'src/public-api.ts';

/**
 * The names npm accepts for a package: lowercase, with an optional scope.
 */
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/;

/**
 * Builds the library a command adds to a workspace from the name of its package: its folder is the name without its
 * scope (`@acme/ui` → `ui`), which names its example component (`ui-example`) and, in a new workspace, the root
 * component of the project testing it (`ui-root`).
 *
 * Exits the process with code `1` when the name is not the name of an npm package, or its folder cannot name a custom
 * element.
 *
 * @param name - The name of the package of the library.
 * @param ssr - Whether the library renders on the server.
 * @returns The library.
 */
export function toWorkspaceLibrary(name: string, ssr: boolean): WorkspaceLibrary {
  if (!PACKAGE_NAME.test(name)) {
    console.error(`✖  Invalid library name "${name}": use the name of an npm package, lowercase, with an optional scope (@acme/ui).`);
    process.exit(1);
  }

  const folder = name.slice(name.lastIndexOf('/') + 1);
  if (!isValidCustomElementName(getExampleComponentName(folder))) {
    process.exit(1);
  }

  return { name, folder, ssr };
}

/**
 * Names the example component a new library holds.
 *
 * @param folder - The folder of the library.
 * @returns The name of the component, its selector.
 */
export function getExampleComponentName(folder: string): string {
  return `${folder}-example`;
}

/**
 * Adds a library to the `libs` of a `xaendar.json`: its folder, and `ssr` when it renders on the server, the other
 * fields keeping their defaults.
 *
 * @param text - The content of the `xaendar.json`.
 * @param library - The library.
 * @returns The new content, with two spaces of indentation.
 * @throws If the content is not JSON.
 */
export function addLibraryToConfig(text: string, { name, folder, ssr }: WorkspaceLibrary): string {
  const config: XaendarConfig = JSON.parse(text);
  const library: XaendarLibraryConfig = { root: `${LIBRARIES_FOLDER}/${folder}` };
  if (ssr) {
    library.ssr = true;
  }

  config.libs = Object.assign({}, config.libs, { [name]: library });
  return toJson(config, text);
}

/**
 * Adds the paths leading the name of a library to its sources to the `compilerOptions` of a `tsconfig.json`: the name
 * to its entry, and the name followed by a path to the files of its `src`, as the Xaendar plugin does for Vite.
 *
 * @param text - The content of the `tsconfig.json`.
 * @param library - The library.
 * @returns The new content, with two spaces of indentation.
 * @throws If the content is not plain JSON: a `tsconfig.json` may hold comments, which only TypeScript reads.
 */
export function addLibraryPaths(text: string, library: WorkspaceLibrary): string {
  const tsconfig: { compilerOptions?: { paths?: Record<string, string[]> } } = JSON.parse(text);
  const compilerOptions = Object.assign({}, tsconfig.compilerOptions);
  compilerOptions.paths = Object.assign({}, compilerOptions.paths, getLibraryPaths(library));
  tsconfig.compilerOptions = compilerOptions;
  return toJson(tsconfig, text);
}

/**
 * Builds the paths of `tsconfig.json` leading the name of a library to its sources.
 *
 * @param library - The library.
 * @returns The paths, keyed by the name they map.
 */
export function getLibraryPaths({ name, folder }: WorkspaceLibrary): Record<string, string[]> {
  const sources = `./${LIBRARIES_FOLDER}/${folder}/src`;
  return { [name]: [`${sources}/public-api.ts`], [`${name}/*`]: [`${sources}/*`] };
}

/**
 * Finds a library of the workspace of a project: the one named, by the name of its package or of its folder, or else
 * the one holding a directory.
 *
 * Exits the process with code `1` when no library has the name given.
 *
 * @param project - The project.
 * @param dir - The directory, looked up when no name is given.
 * @param name - The name of the library, if any.
 * @returns The library with its paths resolved, `undefined` when no name is given and the directory belongs to none.
 */
export function findProjectLibrary(project: XaendarProject, dir: string, name?: string): ResolvedLibrary | undefined {
  const libs = project.config.libs;
  if (libs) {
    const names = Object.keys(libs);
    for (let i = 0; i < names.length; i++) {
      const { root, entry = DEFAULT_LIBRARY_ENTRY } = libs[names[i]];
      const libraryRoot = resolve(project.dir, root);
      const found = name === undefined ? isInside(dir, libraryRoot) : name === names[i] || name === basename(libraryRoot);
      if (found) {
        return { name: names[i], root: libraryRoot, entry: resolve(libraryRoot, entry) };
      }
    }
  }

  if (name !== undefined) {
    console.error(`✖  No library "${name}" in the libs of ${project.configPath}.`);
    process.exit(1);
  }

  return undefined;
}

/**
 * Exports a component from the entry of its library, unless the entry exports it already: `export * from` the path of
 * its file relative to the entry, without the extension.
 *
 * @param entry - The path of the entry of the library, created when it does not exist.
 * @param componentFile - The path of the file of the component.
 */
export function addLibraryExport(entry: string, componentFile: string): void {
  const path = relative(dirname(entry), componentFile).replaceAll('\\', '/').replace(/\.ts$/, '');
  const line = `export * from '${path.startsWith('.') ? path : `./${path}`}';`;
  const text = existsSync(entry) ? readFileSync(entry, 'utf-8') : '';
  if (!text.includes(line)) {
    writeFileSync(entry, `${text}${text && !text.endsWith('\n') ? '\n' : ''}${line}\n`, 'utf-8');
  }
}

/**
 * Tells whether a directory belongs to the folder of a library.
 *
 * @param dir - The directory.
 * @param root - The folder of the library.
 * @returns `true` when the directory is the folder or one of its descendants.
 */
function isInside(dir: string, root: string): boolean {
  const path = relative(root, resolve(dir));
  return !path.startsWith('..') && !isAbsolute(path);
}

/**
 * Writes a JSON file again, with two spaces of indentation, ending with a line break when it did.
 *
 * @param value - The content.
 * @param text - The content the file had.
 * @returns The text of the file.
 */
function toJson(value: unknown, text: string): string {
  return `${JSON.stringify(value, null, 2)}${text.endsWith('\n') ? '\n' : ''}`;
}
