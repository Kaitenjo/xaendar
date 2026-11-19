import { NOT_ALLOWED_TAGS } from '../../costants/not-alllowed-tags.constants';

/**
 * The characters a custom element name can contain after its first letter (`PCENChar` of the HTML specification):
 * lowercase ASCII letters, digits, `-`, `.`, `_` and most non-ASCII characters.
 *
 * @see https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
 */
const PCEN_CHAR = String.raw`\-.0-9_a-z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}`;

/**
 * Matches a potential custom element name (`PotentialCustomElementName` of the HTML specification).
 */
const CUSTOM_ELEMENT_NAME_RE = new RegExp(`^[a-z][${PCEN_CHAR}]*-[${PCEN_CHAR}]*$`, 'u');

/**
 * Checks whether a given tag name is valid for use as a custom element name, with the rules of the HTML
 * specification. A valid custom element name must:
 * - start with a lowercase ASCII letter;
 * - contain a hyphen;
 * - contain only lowercase ASCII letters, digits, `.`, `_`, `-` and the non-ASCII characters the specification
 *   accepts (see {@link PCEN_CHAR}): no uppercase ASCII letter, whitespace or other ASCII symbol;
 * - not be a reserved tag name (see {@link isReservedTagName}).
 *
 * Native HTML tag names contain no hyphen, so the rules above already exclude them.
 *
 * @param tagName - The tag name to validate.
 * @param logErrors - Whether the reason a name is invalid is logged with `console.error`. Defaults to `true`.
 * @returns `true` if the tag name is a valid custom element name, `false` otherwise.
 */
export function isValidCustomElementName(tagName: string, logErrors = true): boolean {
  if (!CUSTOM_ELEMENT_NAME_RE.test(tagName)) {
    logErrors && console.error(`Tag <${tagName}> is not a valid custom element name. Custom element names must:
- start with a lowercase ASCII letter.
- contain a hyphen.
- not contain uppercase ASCII letters, whitespace, or ASCII symbols other than '-', '.' and '_'.
`);
    return false;
  }

  if (isReservedTagName(tagName)) {
    logErrors && console.error(`Tag <${tagName}> is a reserved tag name and cannot be used as a custom element name.
Reserved names are: 
- ${NOT_ALLOWED_TAGS.join('\n- ')}`);
    return false;
  }

  return true;
}

/**
 * Checks whether a tag name matches one of the patterns declaring the custom elements of other libraries,
 * where `*` stands for any sequence of characters (`sl-*` matches `sl-button` and `sl-icon-button`).
 * Any other character of a pattern matches itself.
 *
 * @param tagName - The tag name to check.
 * @param patterns - The patterns of the custom elements, e.g. `['sl-*', 'my-legacy-widget']`.
 * @returns `true` if the tag name matches at least one pattern, `false` otherwise.
 */
export function matchesCustomElementPattern(tagName: string, patterns: readonly string[]): boolean {
  return patterns.some(pattern => {
    const source = pattern.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
    return new RegExp(`^${source}$`).test(tagName);
  });
}

/**
 * Checks if a tag name is reserved and cannot be used for a custom element.
 * 
 * Reserved names include certain HTML, SVG, or other names that are forbidden by the specification.
 * https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
 * 
 * @param tagName - The tag name to check.
 * @returns `true` if the tag name is reserved, `false` otherwise.
 */
function isReservedTagName(tagName: string): boolean {
  return NOT_ALLOWED_TAGS.includes(tagName);
}