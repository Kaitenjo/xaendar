import { describeUnsafeSanitizerOptions } from '@xaendar/internals';
import type { HtmlSecurityOptions } from '../../types/html-security-options.type';

/**
 * The options of `HtmlSecurityOptions`, the lists of names the `html` of the security of `xaendar.json` can hold.
 */
const HTML_SECURITY_OPTIONS: ReadonlySet<string> = new Set(['allowElements', 'allowAttributes', 'removeElements', 'removeAttributes', 'urlSchemes']);

/**
 * Finds what is wrong with the `html` of the security of `xaendar.json`, which the runtime passes to the sanitizer of
 * `@@innerHtml` as it is: an object other than one of lists of names, or options keeping what always runs code (see
 * `describeUnsafeSanitizerOptions` of `@xaendar/internals`, the check of the sanitizer itself), so that the build
 * fails instead of the first page sanitizing an HTML.
 *
 * @param html - The value of `html`, as `xaendar.json` writes it.
 * @returns The problem, written to follow the name of the option (`holds …`, `keeps …`), `undefined` when the options
 *   can be used.
 */
export function findHtmlSecurityError(html: unknown): string | undefined {
  if (typeof html !== 'object' || html === null || Array.isArray(html)) {
    return 'is not an object of options of the sanitizer';
  }

  const names = Object.keys(html);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (!HTML_SECURITY_OPTIONS.has(name)) {
      return `holds ${name}, which is not an option of the sanitizer: ${Array.from(HTML_SECURITY_OPTIONS).join(', ')}`;
    }

    const list: unknown = (html as Record<string, unknown>)[name];
    if (!Array.isArray(list) || !list.every(item => typeof item === 'string')) {
      return `holds ${name}, which is not a list of names`;
    }
  }

  const unsafe = describeUnsafeSanitizerOptions(html as HtmlSecurityOptions);
  return unsafe === undefined ? undefined : `keeps what always runs code (${unsafe}): render such an HTML with trustHtml(), or with a sanitizer of the application, instead`;
}
