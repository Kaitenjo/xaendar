import { escapeAttribute, escapeRawText, escapeText } from '@xaendar/common';

/**
 * Escapes the value of an interpolation written as text, converted to a string as the browser converts it (see
 * {@link toText}).
 *
 * @param value - The value.
 * @returns The escaped text.
 * @throws A `TypeError` for a symbol, as a text node throws it.
 */
export function _escapeText(value: unknown): string {
  return escapeText(toText(value));
}

/**
 * Escapes the value of an attribute, converted to a string as the client converts it when it writes the attribute.
 *
 * @param value - The value.
 * @returns The escaped value.
 */
export function _escapeAttribute(value: unknown): string {
  return escapeAttribute(String(value));
}

/**
 * Prepares the value of an interpolation written as the text of an element whose content the parser does not decode,
 * such as `<style>`: converted as the browser converts it (see {@link toText}), and written as it is, except for the
 * sequences ending the element.
 *
 * @param value - The value.
 * @param tagName - The tag name of the element.
 * @returns The text.
 * @throws A `TypeError` for a symbol, as a text node throws it.
 */
export function _escapeRawText(value: unknown, tagName: string): string {
  return escapeRawText(toText(value), tagName);
}

/**
 * Converts the value of an interpolation to the text the browser renders for it: `null` and `undefined` are an empty
 * text, as `textContent` writes them, any other value its string.
 *
 * @param value - The value.
 * @returns The text.
 * @throws A `TypeError` for a symbol, as a text node throws it.
 */
function toText(value: unknown): string {
  return value === null || value === undefined ? '' : `${value}`;
}
