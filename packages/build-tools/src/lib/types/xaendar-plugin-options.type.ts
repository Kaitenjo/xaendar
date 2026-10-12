import type { CompileOptions } from '@xaendar/compiler';

/**
 * Options of the Xaendar Vite plugin.
 */
export type XaendarPluginOptions = {
  /**
   * Patterns of the tag names of the custom elements of other libraries (e.g. `sl-*`), where `*` stands for any
   * sequence of characters. Templates use them like native elements, without importing them. Defaults to none.
   */
  readonly customElements?: CompileOptions['customElements'];
};
