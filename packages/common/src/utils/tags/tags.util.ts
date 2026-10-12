import { NOT_ALLOWED_TAGS } from '../../costants/not-alllowed-tags.constants';

/**
 * Asserts that a given tag name is valid for use as a custom element name.
 * A valid custom element name must:
 * - contain a hyphen
 * - no spaces.
 * - start with a lowercase letter.
 * - not contain uppercase letters.
 * - not contain the following chars: '@', '#', '$', '%', '&', '*', '!', '?', '/', '\\', '|', "'", '"', '<', '>', '='
 * - not be a native HTML tag name.
 * - not be a reserved tag name.
 *
 * @param tagName - The tag name to validate.
 * @throws Will throw an error if the tag name is invalid.
 */
export function isValidCustomElementName(tagName: string, logErrors = true): boolean {
  if (!/^[a-z][a-z0-9._\-]*-[a-z0-9._\-]*$/.test(tagName)) {
    logErrors && console.error(`Tag <${tagName}> is not a valid custom element name. Custom element names must:
- contain a hyphen
- no spaces.
- start with a lowercase letter.
- not contain uppercase letters.
- not be a native HTML tag name.
- not contain the following chars: '@', '#', '$', '%', '&', '*', '!', '?', '/', '\\', '|', "'", '"', '<', '>', '='
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