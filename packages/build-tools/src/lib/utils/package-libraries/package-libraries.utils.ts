import type { PackageLibrary } from '@xaendar/compiler';
import type { UserConfig } from 'vite';
import { registerLibrarySelectors } from '../../registry/metadata-registry/metadata-registry';

/**
 * The packages of Xaendar the compiled code imports: an application and its libraries share one copy of each, as
 * `@xaendar/core` keeps the registries of the components and of the directives at module level.
 */
const XAENDAR_PACKAGES = ['@xaendar/core', '@xaendar/signals', '@xaendar/common', '@xaendar/types', '@xaendar/ssr'];

/**
 * Configures Vite for the compiled libraries a project depends on: one copy of each package of Xaendar
 * (`resolve.dedupe`), and every module the libraries export optimized when the dev server starts
 * (`optimizeDeps.include`), not when a page imports it first, which would reload the page. The packages of Xaendar are
 * left out of the optimization, so that a project importing them from their sources (an alias) gets no second copy of
 * them inside the optimized libraries.
 *
 * @param libraries - The libraries.
 * @returns The configuration.
 */
export function getPackageLibrariesConfig(libraries: readonly PackageLibrary[]): Pick<UserConfig, 'resolve' | 'optimizeDeps'> {
  const include = new Array<string>();
  for (let i = 0; i < libraries.length; i++) {
    const { name, exports } = libraries[i].manifest;
    const paths = Object.keys(exports);
    for (let j = 0; j < paths.length; j++) {
      include.push(`${name}${paths[j].slice(1)}`);
    }
  }

  return { resolve: { dedupe: XAENDAR_PACKAGES }, optimizeDeps: { include, exclude: XAENDAR_PACKAGES } };
}

/**
 * Registers the selectors the compiled libraries a project depends on define (see `registerLibrarySelectors`), the ones
 * of their components and directives they do not export included: a component or a directive of the project declaring
 * one of them fails the build.
 *
 * @param libraries - The libraries.
 * @throws If two libraries define the same selector.
 */
export function registerPackageLibraries(libraries: readonly PackageLibrary[]): void {
  for (let i = 0; i < libraries.length; i++) {
    const { name, selectors } = libraries[i].manifest;
    const conflict = registerLibrarySelectors(name, selectors);
    if (conflict) {
      throw new Error(conflict);
    }
  }
}
