import type { ComponentOrDirectiveMetadata, ImportedSymbol } from '@xaendar/compiler';
import { posix } from 'node:path';
import type { CompilerOptions } from 'typescript';
import type { Alias } from 'vite';
import type { BuildLibraryOptions } from '../../types/build-library-options.type';
import type { WorkspaceLibrary } from '../../types/workspace-library.type';
import type { XaendarLibraryOptions } from '../../types/xaendar-library-options.type';
import { resolvePosixPath, toPosixPath } from '../path/path.utils';

/**
 * The module exporting what a library publishes, relative to its folder, when its options name none.
 */
const DEFAULT_ENTRY = 'src/public-api.ts';

/**
 * Resolves the libraries of the workspace from the options of the plugin: their folders and entries as absolute paths
 * with forward slashes, the defaults of the options they leave out applied.
 *
 * @param libraries - The libraries, as the options of the plugin declare them.
 * @param cwd - The directory Vite is launched from, the relative folders are resolved against.
 * @returns The libraries, `undefined` when there is none.
 */
export function resolveWorkspaceLibraries(libraries: readonly XaendarLibraryOptions[] | undefined, cwd: string): WorkspaceLibrary[] | undefined {
  if (!libraries?.length) {
    return undefined;
  }

  return libraries.map(({ name, root, entry = DEFAULT_ENTRY, ssr = false, customElements = [] }) => {
    const resolvedRoot = resolvePosixPath(cwd, root);
    return { name, root: resolvedRoot, entry: resolvePosixPath(resolvedRoot, entry), ssr, customElements };
  });
}

/**
 * Finds the library a file belongs to: the one whose folder holds it.
 *
 * @param libraries - The libraries of the workspace, if any.
 * @param fileName - The path of the file.
 * @returns The library, `undefined` when the file belongs to none.
 */
export function findWorkspaceLibrary(libraries: readonly WorkspaceLibrary[] | undefined, fileName: string): WorkspaceLibrary | undefined {
  const path = toPosixPath(fileName);
  return libraries?.find(({ root }) => path.startsWith(`${root}/`));
}

/**
 * Builds the aliases leading the names of the libraries to their sources, as the `paths` of `tsconfig.json` do for
 * TypeScript: the name of a library to its entry, and the name followed by a path to the files beside the entry.
 *
 * @example
 * // @acme/ui → /ws/libraries/ui/src/public-api.ts, @acme/ui/card/card.xd.component → /ws/libraries/ui/src/card/card.xd.component
 * getLibraryAliases([{ name: '@acme/ui', root: '/ws/libraries/ui', entry: '/ws/libraries/ui/src/public-api.ts', … }]);
 *
 * @param libraries - The libraries of the workspace.
 * @returns The aliases, two for each library.
 */
export function getLibraryAliases(libraries: readonly WorkspaceLibrary[]): Alias[] {
  const aliases = new Array<Alias>();
  for (let i = 0; i < libraries.length; i++) {
    const { name, entry } = libraries[i];
    const pattern = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    aliases.push(
      { find: new RegExp(`^${pattern}$`), replacement: entry },
      { find: new RegExp(`^${pattern}/(.*)$`), replacement: `${posix.dirname(entry)}/$1` }
    );
  }

  return aliases;
}

/**
 * Makes a component of a library that does not render on the server render only in the browser, as it does in an
 * application rendering on the server, which gets no code of the server for it: the server of the project writes it
 * from its metadata, as a component declaring `ssr: { render: false }`, and never loads its module.
 *
 * @param imported - What an `@import` of a template imports.
 * @param libraries - The libraries of the workspace, if any.
 * @returns What the `@import` imports, a component of a library not rendering on the server marked as rendering only in the browser.
 */
export function markClientOnly<Imported extends ComponentOrDirectiveMetadata | ImportedSymbol>(imported: Imported, libraries: readonly WorkspaceLibrary[] | undefined): Imported {
  if (imported.type === 'component' && !imported.clientOnly && findWorkspaceLibrary(libraries, imported.modulePath)?.ssr === false) {
    imported.clientOnly = {};
  }

  return imported;
}

/**
 * Leads the names of the libraries of the workspace a library depends on to the folders of their builds, in the `paths`
 * of its options of TypeScript, in place of their sources: the library reads them as an application installing them
 * does, from their declarations and their manifests.
 *
 * @example
 * // @acme/ui → /ws/dist/ui (its package.json leads to its declarations), @acme/ui/card/card.xd.component → /ws/dist/ui/card/card.xd.component
 * withLibraryDependencies(options, { '@acme/ui': '/ws/dist/ui' });
 *
 * @param options - The options of TypeScript of the library.
 * @param dependencies - The libraries it depends on, by the name of their package, mapped to the folder of their build.
 * @returns The options, with the paths of the libraries; the same options when it depends on none.
 */
export function withLibraryDependencies(options: CompilerOptions, dependencies: BuildLibraryOptions['dependencies']): CompilerOptions {
  if (!dependencies) {
    return options;
  }

  const paths: Record<string, string[]> = Object.assign({}, options.paths);
  const names = Object.keys(dependencies);
  for (let i = 0; i < names.length; i++) {
    const dir = toPosixPath(dependencies[names[i]]);
    paths[names[i]] = [dir];
    paths[`${names[i]}/*`] = [`${dir}/*`];
  }

  return Object.assign({}, options, { paths });
}
