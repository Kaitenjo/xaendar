import { disposeLanguageService } from '@xaendar/language-core';
import { existsSync } from 'node:fs';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { build } from 'vite';
import { clearMetadataRegistry } from '../../registry/metadata-registry/metadata-registry';
import type { BuildLibraryOptions } from '../../types/build-library-options.type';
import type { LibraryBuild } from '../../types/library-build.type';
import type { LibraryPackageJson } from '../../types/library-package-json.type';
import { resolvePosixPath } from '../../utils/path/path.utils';
import { resolveWorkspaceLibraries } from '../../utils/workspace-libraries/workspace-libraries.utils';
import { analyzeLibrary, createLibraryProgram } from '../library-analysis/library-analysis.utils';
import { createExternalMatcher, createLibraryBuildConfig } from '../library-build-config/library-build-config.utils';
import { emitLibraryDeclarations } from '../library-declarations/library-declarations.utils';
import { createLibraryManifest, createLibraryPackageJson } from '../library-package/library-package.utils';

/**
 * The files of the folder of a library copied into its package, when it has them.
 */
const PACKAGE_FILES = ['README.md', 'LICENSE', 'LICENSE.md'];

/**
 * Builds a library of components and directives into a package ready to be published (`npm publish <outDir>`), already
 * compiled: the applications installing it import its components and directives in their templates, by the name of
 * the package, without compiling them.
 *
 * The package holds:
 * - the JavaScript of the browser: an ES module for the entry and one for each module declaring a component or a
 *   directive, named after its path relative to the folder of the entry (`card/card.xd.component.js`), the templates
 *   compiled into them, the packages the library depends on, the Xaendar ones included, left to the application;
 * - with `ssr`, the same modules compiled for the server, in `server`;
 * - the declarations of the modules (`.d.ts`);
 * - `xaendar-manifest.json`, describing the components and the directives it exports (see `LibraryManifest`);
 * - its `package.json` (see `createLibraryPackageJson`), and the `README.md` and the license of the library.
 *
 * Each library is compiled on its own: the components and the directives an earlier build registered, as another
 * library of the workspace compiled from its sources, are forgotten first, and so is the program type-checking its
 * templates, whose options were the ones of that library.
 *
 * @param options - The library, its options, the folder of the package and the plugins transpiling the decorators.
 * @returns A promise resolving once the package is written.
 * @throws If the library cannot be read or compiled, or its declarations cannot be emitted.
 */
export async function buildLibrary(options: BuildLibraryOptions): Promise<void> {
  clearMetadataRegistry();
  disposeLanguageService();
  const library: LibraryBuild = Object.assign({ dependencies: options.dependencies }, resolveWorkspaceLibraries([options], process.cwd())![0]);
  const outDir = resolvePosixPath(process.cwd(), options.outDir);
  const packageJson: LibraryPackageJson = JSON.parse(await readFile(`${library.root}/package.json`, 'utf-8'));
  const program = createLibraryProgram(library, outDir);
  const analysis = await analyzeLibrary(library, program);
  const manifest = createLibraryManifest(packageJson, analysis, program, library, options.xaendarVersion);
  const external = createExternalMatcher(packageJson);

  await build(createLibraryBuildConfig(library, options.plugins, analysis, outDir, external, false));
  if (library.ssr) {
    await build(createLibraryBuildConfig(library, options.plugins, analysis, outDir, external, true));
  }

  emitLibraryDeclarations(program, analysis.base);
  await writeFile(`${outDir}/xaendar-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
  await writeFile(`${outDir}/package.json`, `${JSON.stringify(createLibraryPackageJson(packageJson, analysis, library.ssr, options.xaendarVersion), null, 2)}\n`, 'utf-8');
  for (let i = 0; i < PACKAGE_FILES.length; i++) {
    const file = `${library.root}/${PACKAGE_FILES[i]}`;
    if (existsSync(file)) {
      await copyFile(file, `${outDir}/${PACKAGE_FILES[i]}`);
    }
  }
}
