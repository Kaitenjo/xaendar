/**
 * The elements without content, whose end tag is never written (the void elements of the HTML specification, the
 * obsolete ones included): the parser closes them on their own.
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#void-elements
 */
const VOID_ELEMENTS: ReadonlySet<string> = new Set(['area', 'base', 'basefont', 'bgsound', 'br', 'col', 'embed', 'frame', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

/**
 * The elements whose text is written as it is, since the parser reads their content up to their end tag without
 * decoding any character reference: the ones the serialization algorithm of the HTML specification writes literally,
 * `noscript` included, which a browser running scripts parses this way.
 *
 * @see https://html.spec.whatwg.org/multipage/parsing.html#serialising-html-fragments
 */
const RAW_TEXT_ELEMENTS: ReadonlySet<string> = new Set(['iframe', 'noembed', 'noframes', 'noscript', 'plaintext', 'script', 'style', 'xmp']);

/**
 * The elements a line feed right after the start tag of is dropped by the parser.
 */
const LEADING_NEWLINE_ELEMENTS: ReadonlySet<string> = new Set(['listing', 'pre', 'textarea']);

/**
 * The replacement of each character escaped in a text or in the value of an attribute.
 */
const ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '"': '&quot;',
  '<': '&lt;',
  '>': '&gt;'
};

/**
 * Escapes a text written as the content of an element: the parser reads it back as the same text.
 *
 * @param value - The text.
 * @returns The text with `&`, `<` and `>` escaped.
 */
export function escapeText(value: string): string {
  return value.replace(/[&<>]/g, char => ESCAPES[char]);
}

/**
 * Escapes the value of an attribute written between double quotes: the parser reads it back as the same value.
 *
 * @param value - The value of the attribute.
 * @returns The value with `&`, `"`, `<` and `>` escaped.
 */
export function escapeAttribute(value: string): string {
  return value.replace(/[&"<>]/g, char => ESCAPES[char]);
}

/**
 * Prepares a text written as the content of an element that the parser does not decode (see {@link isRawTextElement}):
 * it is written as it is, except for the sequences that would end the element early, whose slash is escaped
 * (`<\/script`), which a script or a stylesheet reads as the same text.
 *
 * @param value - The text.
 * @param tagName - The tag name of the element containing it.
 * @returns The text, without sequences ending the element.
 */
export function escapeRawText(value: string, tagName: string): string {
  return value.replace(new RegExp(`</(${tagName})`, 'gi'), '<\\/$1');
}

/**
 * Tells whether an element of the HTML namespace is a void element, whose end tag is never written.
 *
 * @param tagName - The tag name of the element.
 * @returns `true` for a void element, `false` otherwise.
 */
export function isVoidElement(tagName: string): boolean {
  return VOID_ELEMENTS.has(tagName);
}

/**
 * Tells whether the text of an element of the HTML namespace is written as it is (see {@link escapeRawText}).
 *
 * @param tagName - The tag name of the element.
 * @returns `true` for an element whose content the parser does not decode, `false` otherwise.
 */
export function isRawTextElement(tagName: string): boolean {
  return RAW_TEXT_ELEMENTS.has(tagName);
}

/**
 * Tells whether the parser drops a line feed right after the start tag of an element of the HTML namespace: a line feed
 * is then always written after it, so that a content starting with one keeps it.
 *
 * @param tagName - The tag name of the element.
 * @returns `true` for `pre`, `textarea` and `listing`, `false` otherwise.
 */
export function dropsLeadingNewline(tagName: string): boolean {
  return LEADING_NEWLINE_ELEMENTS.has(tagName);
}
