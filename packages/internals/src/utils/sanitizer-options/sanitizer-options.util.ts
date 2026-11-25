import type { SanitizerOptionLists } from '../../types/sanitizer-option-lists.type';

/**
 * The elements the options of the sanitizer may not allow, whatever the attributes kept, with the reason: a `script`
 * runs once the page rendered on the server holds it, a `base` changes where every relative URL of the page leads, a
 * `meta` can send the page elsewhere.
 */
const UNSAFE_ELEMENTS: ReadonlyMap<string, string> = new Map([
  ['base', 'which changes where every relative URL of the page leads'],
  ['meta', 'which can send the page elsewhere (http-equiv="refresh")'],
  ['script', 'whose code the browser runs once the page rendered on the server holds it']
]);

/**
 * The schemes the options of the sanitizer may not allow, which run code.
 */
const UNSAFE_URL_SCHEMES: ReadonlySet<string> = new Set(['javascript', 'vbscript']);

/**
 * Describes what options of the HTML sanitizer keep that always runs code, whatever the HTML: a `script`, a `base` or a
 * `meta` (see `UNSAFE_ELEMENTS`), an event handler attribute or a `srcdoc`, on every element or on some
 * (`img[onerror]`), a `javascript:` or `vbscript:` URL. A name ending with `*` matching one of them counts as listing it
 * (`o*`). Shared by `@@innerHtml`, which throws at the first use of the options, and the build, which rejects the `html`
 * of the security of `xaendar.json`.
 *
 * @param options - The options.
 * @returns The first one found, as `The <option> of the sanitizer list <name>, <what it keeps>`, `undefined` when the
 *   options keep nothing that always runs code.
 */
export function describeUnsafeSanitizerOptions({ allowElements, allowAttributes, urlSchemes }: SanitizerOptionLists): string | undefined {
  if (allowElements?.length) {
    for (let i = 0; i < allowElements.length; i++) {
      const listed = toAsciiLowerCase(allowElements[i]);
      for (const [element, reason] of UNSAFE_ELEMENTS) {
        if (listsName(listed, element, false)) {
          return `The allowElements of the sanitizer list ${allowElements[i]}, keeping <${element}>, ${reason}`;
        }
      }
    }
  }

  if (allowAttributes?.length) {
    for (let i = 0; i < allowAttributes.length; i++) {
      const written = toAsciiLowerCase(allowAttributes[i]);
      const listed = written.endsWith(']') ? written.slice(written.indexOf('[') + 1, -1) : written;
      if (listsName(listed, 'on', true) || listsName(listed, 'srcdoc', false)) {
        return `The allowAttributes of the sanitizer list ${allowAttributes[i]}, keeping an attribute the browser runs (on*, srcdoc)`;
      }
    }
  }

  const scheme = urlSchemes?.find(listed => UNSAFE_URL_SCHEMES.has(toAsciiLowerCase(listed)));
  return scheme === undefined ? undefined : `The urlSchemes of the sanitizer list ${scheme}, a scheme running code`;
}

/**
 * Tells whether a name the options list matches a name, or the names starting with a prefix: as it is, or as a prefix
 * ending with `*` (`o*` matches `onclick`).
 *
 * @param listed - The name listed, lowercase.
 * @param name - The name, or the prefix.
 * @param prefix - Whether `name` is a prefix of names (`on`).
 * @returns `true` when the name listed matches it.
 */
function listsName(listed: string, name: string, prefix: boolean): boolean {
  if (listed.endsWith('*')) {
    const start = listed.slice(0, -1);
    return name.startsWith(start) || (prefix && start.startsWith(name));
  }

  return prefix ? listed.startsWith(name) : listed === name;
}

/**
 * Turns the ASCII letters of a name lowercase, as HTML compares the names of the elements and of the attributes.
 *
 * @param name - The name.
 * @returns The name, lowercase.
 */
function toAsciiLowerCase(name: string): string {
  return name.replace(/[A-Z]+/g, letters => letters.toLowerCase());
}
