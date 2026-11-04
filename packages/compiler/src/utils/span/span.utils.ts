import type { Span } from '../../types/span.type';

/**
 * Tells whether a value is a span, e.g. the `cause` of an error raised for a part of the template.
 *
 * @param value - The value to check.
 * @returns `true` if the value has a `start` and an `end`, `false` otherwise.
 */
export function isSpan(value: unknown): value is Span {
  return !!value && typeof value === 'object' && 'start' in value && 'end' in value;
}

/**
 * Finds the span of a text written verbatim in the template, looking for it from an offset onwards: e.g. the name
 * of an attribute inside the span of its token, which covers the `="` following the name too.
 *
 * @param input - The template source.
 * @param text - The text to find.
 * @param from - The offset the search starts from, usually the start of the span of the token holding the text.
 * @returns The span of the first occurrence of the text from `from` onwards, or an empty span at `from` when it is not found.
 */
export function findSpan(input: string, text: string, from: number): Span {
  const start = input.indexOf(text, from);
  return start === -1 ? { start: from, end: from } : { start, end: start + text.length };
}
