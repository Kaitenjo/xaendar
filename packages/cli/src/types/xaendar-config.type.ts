import type { XaendarLibraryConfig } from './xaendar-library-config.type';
import type { XaendarSsrConfig } from './xaendar-ssr-config.type';

/**
 * The configuration of a project, read from its `xaendar.json`: the fields the commands read.
 */
export type XaendarConfig = {
  /**
   * The patterns of the tag names of the custom elements of other libraries (`sl-*`).
   */
  customElements?: string[];
  /**
   * The rendering on the server, when the project renders its pages there.
   */
  ssr?: XaendarSsrConfig;
  /**
   * The libraries of the workspace, keyed by the name of their package: the project of the `xaendar.json` is the
   * project testing them, which imports them from their sources.
   */
  libs?: Record<string, XaendarLibraryConfig>;
};
