import type { Span } from '../../../types/span.type';

/**
 * A duration: a number, with decimals or without, followed by `ms`, by `s`, or by nothing for milliseconds.
 */
const DURATION = /^(\d+(?:\.\d+)?)(ms|s)?$/;

/**
 * Parses a duration written in a template, in the arguments of a trigger or in the parameters of a block: `500ms`,
 * `1.5s`, or `200`, in milliseconds.
 *
 * @example
 * parseDuration('1.5s', span); // 1500
 *
 * @param text - The duration, as written.
 * @param span - Where it is written, the cause of the error.
 * @returns The duration, in milliseconds.
 * @throws When the text is not a duration.
 */
export function parseDuration(text: string, span: Span): number {
  const match = DURATION.exec(text);
  if (!match) {
    throw new Error(`Expected a duration, such as 500ms or 1s, got "${text}"`, { cause: span });
  }

  const value = Number(match[1]);
  return match[2] === 's' ? value * 1000 : value;
}
