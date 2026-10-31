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
  /**
   * Renders the pages on the server. The modules evaluated on the server, the ones of the `ssr` environment of Vite,
   * register templates compiled into HTML, with `@xaendar/ssr`, and the dev server renders each page it serves with the
   * entry. Without it, every environment gets the templates of the browser.
   */
  readonly ssr?: {
    /**
     * The module rendering a page on the server: it exports `render(url)`, returning the HTML replacing `<!--xd-ssr-->`
     * in `index.html`. Absolute, or relative to the root of Vite.
     */
    readonly entry: string;
  };
};
