import { slice } from "@xaendar/common";
import { Span } from "../types/span.type";

/**
 * Catches an error and formats it with a given prefix, including the relevant input slice if available.
 * @param prefix The prefix to include in the error message.
 * @param input The input string from which the error span is derived.
 * @param err The error object to process.
 * @throws Will throw an error with the given prefix and relevant input slice if available.
 */
export function catchErrorWithPrefix(prefix: string, input: string, err: unknown): void {
  if (err instanceof Error) {
    const { message, cause, stack } = err;
    const isSpan = (cause: unknown): cause is Span => !!cause && typeof cause === 'object' && 'start' in cause && 'end' in cause;
    if (isSpan(cause)) {
      throw `[${prefix}] ${message}\n----> ${slice(input, cause.start, cause.end)}`
    }

    const error = new Error(`[${prefix}] ${message}`);
    error.stack = stack;
    throw error;
  } else {
    throw new Error(`[${prefix}] ${err}`);
  }
}