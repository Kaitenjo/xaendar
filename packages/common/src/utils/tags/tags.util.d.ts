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
export declare function isValidCustomElementName(tagName: string, logErrors?: boolean): boolean;
/**
 * Checks whether a tag name matches one of the patterns declaring the custom elements of other libraries,
 * where `*` stands for any sequence of characters (`sl-*` matches `sl-button` and `sl-icon-button`).
 * Any other character of a pattern matches itself.
 *
 * @param tagName - The tag name to check.
 * @param patterns - The patterns of the custom elements, e.g. `['sl-*', 'my-legacy-widget']`.
 * @returns `true` if the tag name matches at least one pattern, `false` otherwise.
 */
export declare function matchesCustomElementPattern(tagName: string, patterns: readonly string[]): boolean;
