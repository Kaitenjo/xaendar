import { buildLibrary } from '@xaendar/build-tools';
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { readCliVersion } from '../../commands/new/structure/structure';
import type { LibraryOrder } from '../../types/library-order.type';
import type { ResolvedLibrary } from '../../types/resolved-library.type';
import type { XaendarProject } from '../../types/xaendar-project.type';
import { findProjectLibrary } from '../library/library.utils';
import { createBabelPlugin } from '../plugins';

/**
 * Builds the libraries of a workspace, each one into a package ready to be published (see `buildLibrary` of
 * `@xaendar/build-tools`), into the `outDir` of its entry, `dist/<folder>` by default: every library, or only the one
 * named, by the name of its package or of its folder, with the libraries of the workspace it depends on. A library is
 * built after the ones it depends on, which it reads from their builds, as an application installing them does; the
 * others in the order of the `libs` of `xaendar.json`.
 *
 * Exits the process with code `1` when no library has the name given, or a library depends on itself through the
 * libraries it depends on.
 *
 * @param project - The workspace.
 * @param name - The library to build, every one when not given.
 * @returns A promise resolving once the libraries are built.
 */
export async function buildLibraries(project: XaendarProject, name?: string): Promise<void> {
  const libs = project.config.libs!;
  const names = Object.keys(libs);
  const order = createLibraryOrder(project, names);
  const roots = name === undefined ? names : [findProjectLibrary(project, project.dir, name)!.name];
  for (let i = 0; i < roots.length; i++) {
    orderLibrary(roots[i], order);
  }

  const version = readCliVersion();
  const outDirs = new Map<string, string>();
  for (const [libraryName, dependencies] of order.ordered) {
    const { root } = order.libraries.get(libraryName)!;
    const { outDir, ssr, customElements, entry } = libs[libraryName];
    const libraryOutDir = resolve(project.dir, outDir ?? `dist/${basename(root)}`);
    const options = { name: libraryName, root, entry, outDir: libraryOutDir, ssr: ssr === true, customElements, plugins: [createBabelPlugin()], xaendarVersion: version };
    await buildLibrary(dependencies.length ? Object.assign(options, { dependencies: toBuildDependencies(dependencies, outDirs) }) : options);
    outDirs.set(libraryName, libraryOutDir);
    console.log(`✔  ${libraryName} → ${libraryOutDir}`);
  }
}

/**
 * Reads the libraries of a workspace and the ones of the workspace each one depends on, from the `dependencies` and the
 * `peerDependencies` of its `package.json`.
 *
 * @param project - The workspace.
 * @param names - The names of the packages of the libraries.
 * @returns The order of the libraries, still empty.
 */
function createLibraryOrder(project: XaendarProject, names: readonly string[]): LibraryOrder {
  const libraries = new Map<string, ResolvedLibrary>();
  for (let i = 0; i < names.length; i++) {
    libraries.set(names[i], findProjectLibrary(project, project.dir, names[i])!);
  }

  const dependencies = new Map<string, string[]>();
  for (const { name, root } of libraries.values()) {
    const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8')) as { dependencies?: Record<string, string>, peerDependencies?: Record<string, string> };
    dependencies.set(name, names.filter(other => other !== name && (packageJson.dependencies?.[other] !== undefined || packageJson.peerDependencies?.[other] !== undefined)));
  }

  return { libraries, dependencies, visiting: new Set(), ordered: new Map() };
}

/**
 * Orders a library after the libraries of the workspace it depends on, ordering them first.
 *
 * Exits the process with code `1` when the library depends on itself through them.
 *
 * @param name - The name of the library.
 * @param order - The order, filled.
 * @returns The libraries of the workspace it depends on, directly or through another one.
 */
function orderLibrary(name: string, order: LibraryOrder): string[] {
  const ordered = order.ordered.get(name);
  if (ordered) {
    return ordered;
  }

  if (order.visiting.has(name)) {
    console.error(`✖  ${name} depends on itself, through the libraries of the workspace it depends on: a library is built after the ones it depends on.`);
    process.exit(1);
  }

  order.visiting.add(name);
  const dependencies = new Array<string>();
  const direct = order.dependencies.get(name)!;
  for (let i = 0; i < direct.length; i++) {
    const indirect = orderLibrary(direct[i], order);
    for (let j = 0; j < indirect.length; j++) {
      addOnce(dependencies, indirect[j]);
    }

    addOnce(dependencies, direct[i]);
  }

  order.visiting.delete(name);
  order.ordered.set(name, dependencies);
  return dependencies;
}

/**
 * Adds a name to a list, unless the list holds it already.
 *
 * @param names - The list.
 * @param name - The name.
 */
function addOnce(names: string[], name: string): void {
  if (!names.includes(name)) {
    names.push(name);
  }
}

/**
 * Maps the libraries of the workspace a library depends on to the folders of their builds, written before it.
 *
 * @param dependencies - The names of the libraries.
 * @param outDirs - The folders of the builds written so far, by the name of their library.
 * @returns The folders, by the name of their library.
 */
function toBuildDependencies(dependencies: readonly string[], outDirs: ReadonlyMap<string, string>): Record<string, string> {
  const builds: Record<string, string> = {};
  for (let i = 0; i < dependencies.length; i++) {
    builds[dependencies[i]] = outDirs.get(dependencies[i])!;
  }

  return builds;
}
