import { computed, signal } from '@xaendar/core/signals';
import { navPathOf } from '../routes/routes';
import type { Lang, Route } from './route-hash.utils';
import { formatHash, isLang, parseHash } from './route-hash.utils';

/**
 * Key under which the language last chosen by the reader is stored.
 */
const LANG_STORAGE_KEY = 'xaendar-docs-lang';

/**
 * Reads the language to use when the location does not specify one: the one last chosen by
 * the reader, otherwise the browser language.
 *
 * @returns The preferred language.
 */
function readPreferredLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(stored)) {
      return stored;
    }
  } catch {
    // Storage can be unavailable (e.g. blocked site data): the browser language is used instead
  }

  return navigator.language.toLowerCase().startsWith('it') ? 'it' : 'en';
}

/**
 * The current location hash. The whole application state of the router derives from it.
 *
 * It starts empty, as the server sees it: the hash is never sent to the server, which renders the home page whatever
 * page the URL asks for. The browser hydrates that HTML with the same route, so that it adopts every block the server
 * rendered instead of finding other ones there, then follows the location (see {@link followLocation}).
 */
const hash = signal('');

/**
 * The language used when the location does not specify one. It starts as the server renders, in English, the language
 * of `index.html`: the server knows nothing of the reader, the language of the machine it runs on says nothing of them,
 * and the `localStorage` of Node, without a file, only warns. The browser then reads the preferred one (see
 * {@link followLocation}).
 */
const fallbackLang = signal<Lang>('en');

/**
 * The route currently displayed.
 */
export const route = computed(() => parseHash(hash(), fallbackLang()));

/**
 * The language the documentation is currently read in.
 */
export const lang = computed(() => route().lang);

/**
 * The path of the page currently displayed.
 */
export const path = computed(() => route().path);

/**
 * The path of the navigation entry of the page currently displayed: the pages of the symbols of the API reference
 * highlight the reference.
 */
export const navPath = computed(() => navPathOf(path()));

/**
 * Reads the route the location of the browser asks for, which the router displays once it follows the location.
 *
 * @returns The route of the location.
 */
export function locationRoute(): Route {
  return parseHash(location.hash, readPreferredLang());
}

/**
 * Makes the router follow the location of the browser, once the page the server rendered is hydrated: it displays the
 * route of the location, in the preferred language when the location does not specify one, and the next ones as the
 * hash changes.
 */
export function followLocation(): void {
  fallbackLang.set(readPreferredLang());
  hash.set(location.hash);
  globalThis.addEventListener('hashchange', () => {
    hash.set(location.hash);
    globalThis.scrollTo({ top: 0 });
  });
}

/**
 * Builds the link to a page.
 *
 * @param target - The path of the page.
 * @param targetLang - The language of the page, the current one by default.
 * @returns The `href` of the page.
 */
export function href(target: string, targetLang: Lang = lang()): string {
  return formatHash({ lang: targetLang, path: target });
}

/**
 * Displays a page.
 *
 * @param target - The path of the page.
 * @param targetLang - The language of the page, the current one by default.
 */
export function navigate(target: string, targetLang: Lang = lang()): void {
  location.hash = href(target, targetLang);
}

/**
 * Displays the current page in another language, and remembers the choice.
 *
 * @param targetLang - The language to switch to.
 */
export function switchLang(targetLang: Lang): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, targetLang);
  } catch {
    // The choice is still applied, it just won't be remembered
  }

  navigate(path(), targetLang);
}
