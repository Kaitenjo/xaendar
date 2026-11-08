import type { XaendarLibraryConfig } from './xaendar-library-config.type';

/**
 * What the language service reads from `xaendar.json`.
 */
export type XaendarConfig = {
  /**
   * The patterns of the tag names of the custom elements of other libraries.
   */
  readonly customElements?: readonly string[];
  /**
   * The rendering on the server, which only the CLI reads: its presence tells the project renders on the server.
   */
  readonly ssr?: unknown;
  /**
   * The libraries of the workspace, keyed by the name of their package: the files of a library are compiled with its
   * own options.
   */
  readonly libs?: Readonly<Record<string, XaendarLibraryConfig>>;
};
