/**
 * Languages the documentation is written in.
 */
export type Lang = 'en' | 'it';

/**
 * A value available in every documentation language.
 */
export type Localized<T = string> = Readonly<Record<Lang, T>>;

/**
 * Every documentation language, in the order they are offered to the reader.
 */
export const LANGS: readonly Lang[] = ['en', 'it'];

/**
 * A location of the documentation: the page and the language it is read in.
 */
export type Route = {
  /**
   * The language the page is read in.
   */
  readonly lang: Lang;
  /**
   * The path of the page, without leading or trailing slashes (`''` is the home page).
   */
  readonly path: string;
};

/**
 * Tells whether a value is one of the documentation languages.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a {@link Lang}.
 */
export function isLang(value: unknown): value is Lang {
  return LANGS.includes(value as Lang);
}

/**
 * Parses a location hash in the `#/<lang>/<path>` form.
 *
 * The language segment is optional: when it is missing or unknown, the whole hash is the path
 * and `fallbackLang` is used.
 *
 * @param hash - The location hash, with or without the leading `#`.
 * @param fallbackLang - The language used when the hash does not specify one.
 * @returns The route the hash points to.
 */
export function parseHash(hash: string, fallbackLang: Lang): Route {
  const segments = hash.replace(/^#/, '').split('/').filter(segment => segment.length > 0);
  const [first] = segments;
  if (isLang(first)) {
    return { lang: first, path: segments.slice(1).join('/') };
  }

  return { lang: fallbackLang, path: segments.join('/') };
}

/**
 * Formats a route as a location hash, the inverse of {@link parseHash}.
 *
 * @param route - The route to format.
 * @returns The hash, e.g. `#/en/signals/computed`.
 */
export function formatHash({ lang, path }: Route): string {
  return path ? `#/${lang}/${path}` : `#/${lang}`;
}
