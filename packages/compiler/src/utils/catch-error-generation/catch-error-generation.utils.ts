import { slice } from '@xaendar/common';
import { TemplateError } from '../../models/template-error/template-error.model';
import { isSpan } from '../span/span.utils';

/**
 * Catches an error and formats it with a given prefix, including the relevant input slice if available.
 * @param prefix The prefix to include in the error message.
 * @param input The input string from which the error span is derived.
 * @param err The error object to process.
 * @throws A `TemplateError` with the given prefix and the relevant input slice when the error carries its span
 *   as `cause`, an `Error` with the given prefix otherwise.
 */
export function catchErrorWithPrefix(prefix: string, input: string, err: unknown): void {
  if (err instanceof Error) {
    const { message, cause, stack } = err;
    if (isSpan(cause)) {
      throw new TemplateError(`[${prefix}] ${message}\n----> ${slice(input, cause.start, cause.end)}`, { start: cause.start, end: cause.end }, message);
    }

    const error = new Error(`[${prefix}] ${message}`);
    error.stack = stack;
    throw error;
  } else {
    throw new Error(`[${prefix}] ${err}`);
  }
}