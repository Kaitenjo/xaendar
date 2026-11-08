import { buildLibrary } from '@xaendar/build-tools';
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { readCliVersion } from '../../commands/new/structure/structure';
import type { ResolvedLibrary } from '../../types/resolved-library.type';
import type { XaendarProject } from '../../types/xaendar-project.type';
import { findProjectLibrary } from '../library/library.utils';
import { createBabelPlugin } from '../plugins';

/**
 * Builds the libraries of a workspace, each one into a package ready to be published (see `buildLibrary` of
 * `@xaendar/build-tools`): every library in the order of the `libs` of its `xaendar.json`, or only the one named, by the
 * name of its package or of its folder, into the `outDir` of its entry, `dist/<folder>` by default.
 *
 * Exits the process with code `1` when no library has the name given, or a library depends on another library of the
 * workspace, which is not supported yet.
 *
 * @param project - The workspace.
 * @param name - The library to build, every one when not given.
 * @returns A promise resolving once the libraries are built.
 */
export async function buildLibraries(project: XaendarProject, name?: string): Promise<void> {
  const libs = project.config.libs!;
  const libraries = name === undefined ? Object.keys(libs).map(key => findProjectLibrary(project, project.dir, key)!) : [findProjectLibrary(project, project.dir, name)!];
  checkWorkspaceDependencies(libraries, Object.keys(libs));
  const version = readCliVersion();
  for (let i = 0; i < libraries.length; i++) {
    const library = libraries[i];
    const { outDir, ssr, customElements, entry } = libs[library.name];
    const libraryOutDir = resolve(project.dir, outDir ?? `dist/${basename(library.root)}`);
    await buildLibrary({ name: library.name, root: library.root, entry, outDir: libraryOutDir, ssr: ssr === true, customElements, plugins: [createBabelPlugin()], xaendarVersion: version });
    console.log(`✔  ${library.name} → ${libraryOutDir}`);
  }
}

/**
 * Checks that no library depends on another library of the workspace, which its build would compile again from its
 * sources: the build of a library against the package of another one is not supported yet.
 *
 * Exits the process with code `1` when one does.
 *
 * @param libraries - The libraries to build.
 * @param names - The names of the packages of every library of the workspace.
 */
function checkWorkspaceDependencies(libraries: readonly ResolvedLibrary[], names: readonly string[]): void {
  for (let i = 0; i < libraries.length; i++) {
    const { name, root } = libraries[i];
    const { dependencies, peerDependencies } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8')) as { dependencies?: Record<string, string>, peerDependencies?: Record<string, string> };
    const dependency = names.find(other => other !== name && (dependencies?.[other] !== undefined || peerDependencies?.[other] !== undefined));
    if (dependency) {
      console.error(`✖  ${name} depends on ${dependency}, another library of the workspace: building a library against another one is not supported yet.`);
      process.exit(1);
    }
  }
}
