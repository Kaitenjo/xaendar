import type { ComponentOrDirectiveMetadata } from '@xaendar/compiler';

/**
 * What the build of a library reads of its sources (see `analyzeLibrary`).
 */
export type LibraryAnalysis = {
  /**
   * The folder of the sources, the one of the entry: the files of the package keep the paths of the modules relative
   * to it.
   */
  readonly base: string;
  /**
   * The name of the entry in the build: its path relative to the base, without extension (`public-api`).
   */
  readonly entry: string;
  /**
   * The entries of the build, by name: the entry of the library and every module declaring a component or a directive,
   * so that each one is a file of its own, which an application imports and a `@defer` loads alone.
   */
  readonly entries: Readonly<Record<string, string>>;
  /**
   * The modules declaring a component or a directive, by absolute path, mapped to their name in the build.
   */
  readonly modules: ReadonlyMap<string, string>;
  /**
   * What each path of the `exports` of the package exports: the name of each component and directive, mapped to the key of
   * its declaration (`button/button.xd.component#ButtonComponent`).
   */
  readonly exports: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /**
   * The components and directives the package exports, by the key of their declaration.
   */
  readonly declarations: ReadonlyMap<string, ComponentOrDirectiveMetadata>;
  /**
   * Every selector the library defines, the ones of the directives after `@@`.
   */
  readonly selectors: readonly string[];
};
