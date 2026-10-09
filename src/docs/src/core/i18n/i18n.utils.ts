/**
 * Reads a text by its key, the dot-separated path of the text in the messages
 * (e.g. `pages.signals.computed.lead`).
 *
 * @param messages - The texts of a language.
 * @param key - The key of the text.
 * @returns The text, or the key itself when no text has that key, so that a missing
 * translation stays visible on the page.
 */
export function translate(messages: unknown, key: string): string {
  const value = key.split('.').reduce<unknown>((node, segment) => node !== null && typeof node === 'object' ? Reflect.get(node, segment) : undefined, messages);
  return typeof value === 'string' ? value : key;
}
