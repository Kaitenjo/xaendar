import type { XaendarPluginOptions } from '@xaendar/build-tools';
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
   * Whether the templates warn about the events their elements do not declare (`(bubbling)` on a `<div>`), which a
   * binding hears only when they are dispatched on the element or bubble up to it: `false` turns the warning off, in
   * the build and in the editor. Defaults to `true`.
   */
  strictEvents?: boolean;
  /**
   * How the values of the application that could run code are checked (see `XaendarPluginOptions['security']`), for
   * every component the project renders: the libraries declare none.
   */
  security?: XaendarPluginOptions['security'];
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
