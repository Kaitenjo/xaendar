import { path } from '../router/router';
import { isApiSymbolPath } from '../routes/routes';

/**
 * The module of every page, loaded on demand: a page brings along the components and directives its template
 * imports, and nothing else. The switch button is left out: the top bar imports it.
 */
const PAGE_MODULES = import.meta.glob(['../../pages/**/*.xd.component.ts', '!../../pages/components/switch-button/**']);

/**
 * The page displaying every symbol of the API reference: it reads the symbol from the path.
 */
const API_SYMBOL_PAGE = 'reference/api-symbol';

/**
 * The path whose page was loaded before the outlet was created (see {@link loadInitialPage}), `undefined` when none
 * was.
 */
let preloaded: string | undefined;

/**
 * Finds the page displaying a path.
 *
 * @param target - The path, `''` for the home page.
 * @returns The path of the page, the path itself for every page but the ones of the symbols of the API reference.
 */
export function pageOf(target: string): string {
  return isApiSymbolPath(target) ? API_SYMBOL_PAGE : target;
}

/**
 * Loads the module of the page displaying a path: a path with no page is the not found page, loaded on demand like
 * the others.
 *
 * @param target - The path, `''` for the home page.
 * @returns A promise resolved once the module is loaded.
 */
export async function loadPage(target: string): Promise<void> {
  await (findPageLoader(target) ?? findPageLoader('not-found'))?.();
}

/**
 * Loads the page of the current path before the outlet is created, which then displays it from its first render. The
 * server, which runs no effect, would otherwise render the `@default` of the outlet; the browser, adopting the HTML of
 * the server, would find another block there.
 *
 * @returns A promise resolved once the module of the page is loaded.
 */
export async function loadInitialPage(): Promise<void> {
  const target = path();
  await loadPage(target);
  preloaded = target;
}

/**
 * Tells which page was loaded before the outlet was created.
 *
 * @returns The path of the page, `undefined` when {@link loadInitialPage} has not loaded one.
 */
export function preloadedPage(): string | undefined {
  return preloaded;
}

/**
 * Finds the loader of the module of a page.
 *
 * @param target - The path of the page, `''` for the home page.
 * @returns The loader, `undefined` if no page has that path.
 */
function findPageLoader(target: string): (() => Promise<unknown>) | undefined {
  const folder = target === '' ? 'home' : pageOf(target);
  return PAGE_MODULES[`../../pages/${folder}/${folder.slice(folder.lastIndexOf('/') + 1)}.xd.component.ts`];
}
