import type { LibraryManifestDeclaration } from './library-manifest-declaration.type';

/**
 * The manifest of a library compiled by `xd build` (`xaendar-manifest.json` at the root of its package, which the
 * `xaendar.manifest` field of its `package.json` points to): what the applications importing it need of its components
 * and directives, whose code is already compiled and whose declarations keep no decorator.
 */
export type LibraryManifest = {
  /**
   * The version of the format of the manifest: a reader rejects a version it does not know.
   */
  readonly schemaVersion: 1;
  /**
   * The name of the package.
   */
  readonly name: string;
  /**
   * The version of the package.
   */
  readonly version: string;
  /**
   * The version of Xaendar that compiled the library: an application needs the same major version of `@xaendar/core`,
   * not an older one, since the compiled code calls its internal helpers.
   */
  readonly xaendar: string;
  /**
   * Whether the package holds the code of the server too, chosen by the `xaendar-server` condition of its `exports`:
   * without it, an application rendering on the server renders its components only in the browser.
   */
  readonly ssr: boolean;
  /**
   * What each path of the `exports` of the package exports, the `.` one included: the name of each component and
   * directive it exports, mapped to the key of its declaration.
   */
  readonly exports: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /**
   * The components and directives the package exports, keyed by the path of their module and their class
   * (`button/button.xd.component#ButtonComponent`).
   */
  readonly declarations: Readonly<Record<string, LibraryManifestDeclaration>>;
  /**
   * Every selector the package defines, the ones of the components and directives it does not export included, the
   * selectors of the directives after `@@`: an application cannot define them again.
   */
  readonly selectors: readonly string[];
};
