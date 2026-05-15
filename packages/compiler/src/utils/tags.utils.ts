import { HTML_TAGS } from '../costants/tags/base-tags.constants.js';
import { NOT_ALLOWED_TAGS } from '../costants/tags/not-alllowed-tags.constants.js';
import { NOT_ALLOWED_CHARS_FOR_TAGS } from '../costants/tags/not-allowed-chars.constants.js';

/**
 * Checks if a character is allowed in a custom element tag name.
 * 
 * @param char - The character to check.
 * @returns `true` if the character is allowed, `false` if it is forbidden.
 */
export function isAllowedCharForTag(char: string): boolean {
  return !NOT_ALLOWED_CHARS_FOR_TAGS.includes(char);
}

/**
 * Checks if a tag name is a native HTML tag.
 * 
 * @param tagName - The tag name to check.
 * @returns `true` if the tag name is a standard HTML tag, `false` otherwise.
 */
export function isNativeHTMLTag(tagName: string): boolean {
  return HTML_TAGS.includes(tagName);
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
export function isReservedTagName(tagName: string): boolean {
  return NOT_ALLOWED_TAGS.includes(tagName);
}
