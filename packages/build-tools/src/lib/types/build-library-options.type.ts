import type { PluginOption } from 'vite';
import type { XaendarLibraryOptions } from './xaendar-library-options.type';

/**
 * What `buildLibrary` compiles: a library, with its options, into a folder ready to be published.
 */
export type BuildLibraryOptions = XaendarLibraryOptions & {
  /**
   * The folder the package is written to, absolute or relative to the working directory: it is emptied first.
   */
  readonly outDir: string;
  /**
   * The plugins running before the Xaendar plugin, which needs the decorators transpiled (Babel).
   */
  readonly plugins?: readonly PluginOption[];
  /**
   * The version of Xaendar compiling the library: the applications need the same major version of `@xaendar/core`, not
   * an older one, which the package requires as a peer dependency.
   */
  readonly xaendarVersion: string;
  /**
   * The libraries of the workspace the library depends on, by the name of their package, mapped to the folder of their
   * build: the library reads them from their declarations and their manifests, as an application installing them does,
   * rather than from their sources. Their builds are written first.
   */
  readonly dependencies?: Readonly<Record<string, string>>;
};
