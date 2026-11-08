import type { CompileOptions } from '@xaendar/compiler';
import type { BuildLibraryOptions } from './build-library-options.type';
import type { XaendarLibraryOptions } from './xaendar-library-options.type';

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
     * in `index.html`, `url` being the path of the request with its query string. Absolute, or relative to the root of
     * Vite.
     */
    readonly entry: string;
    /**
     * Whether the build finds the static components, which it leaves out of the bundle of the browser: worth it when
     * the server renders each page and the browser never creates one, not in a single-page application, whose router
     * creates the pages in the browser. Defaults to `false`.
     */
    readonly staticComponents?: boolean;
  };
  /**
   * Whether the build tells what keeps each interactive component in the bundle of the browser, besides listing the
   * static ones, when it finds them (`ssr.staticComponents`). Defaults to `false`.
   */
  readonly staticReport?: boolean;
  /**
   * The libraries of the workspace the project belongs to, which it imports from their sources: their names lead to
   * their entries, and their files are compiled with their own options. Defaults to none.
   */
  readonly libraries?: readonly XaendarLibraryOptions[];
  /**
   * The library the build compiles, set by `buildLibrary`: its files are compiled with its options and type-checked
   * with the `tsconfig.json` of its folder, and, when it renders on the server, the server environment compiles them for
   * the server, without an entry rendering pages. The libraries of the workspace it depends on are read from their
   * builds.
   */
  readonly library?: XaendarLibraryOptions & Pick<BuildLibraryOptions, 'dependencies'>;
};
