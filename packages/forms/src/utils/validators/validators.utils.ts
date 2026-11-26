import type { FormValidator } from '../../types/form-validator.type';
import type { ValueOrGetter } from '../../types/value-or-getter.type';

/**
 * The addresses the HTML specification accepts for a field of type `email`, as the browser and Angular check them.
 */
const EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Reads a limit, a pattern: given as it is, or by a function to follow the signals it reads.
 *
 * @param value - The value, or the function giving it.
 * @returns The value.
 */
function read<Value>(value: ValueOrGetter<Value>): Value {
  return typeof value === 'function' ? (value as () => Value)() : value;
}

/**
 * Tells whether a value is empty, as Angular's validators take it: nothing, an empty text, an empty list, an empty `Set`
 * or `Map`.
 *
 * @param value - The value.
 * @returns `true` when it is empty.
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  const size = (value as { length?: unknown, size?: unknown }).length ?? (value as { size?: unknown }).size;
  return size === 0;
}

/**
 * Reads the length of a value that has one.
 *
 * @param value - The value.
 * @returns Its length, `undefined` when it has none.
 */
function lengthOf(value: unknown): number | undefined {
  const length = (value as { length?: unknown } | null | undefined)?.length;
  return typeof length === 'number' ? length : undefined;
}

/**
 * Reads a value as a number, as Angular's `min` and `max` do.
 *
 * @param value - The value.
 * @returns The number, `undefined` when the value is empty or not a number.
 */
function toNumber(value: unknown): number | undefined {
  if (isEmpty(value)) {
    return undefined;
  }

  const number = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isNaN(number) ? undefined : number;
}

/**
 * Requires a value: it is missing when it is `null`, `undefined`, an empty text, an empty list, an empty `Set` or an
 * empty `Map`. A text of spaces counts as present, as in Angular. Sets `valueMissing`.
 *
 * @param value - Gives the value to check: a signal, a model, an input.
 * @param message - The message of the error.
 * @returns The validator.
 */
export function required(value: () => unknown, message = 'This field is required.'): FormValidator {
  return () => isEmpty(value()) ? { valueMissing: message } : undefined;
}

/**
 * Requires a value to be `true`, as a checkbox to accept the terms. Sets `valueMissing`.
 *
 * @param value - Gives the value to check.
 * @param message - The message of the error.
 * @returns The validator.
 */
export function requiredTrue(value: () => unknown, message = 'This field must be checked.'): FormValidator {
  return () => value() === true ? undefined : { valueMissing: message };
}

/**
 * Requires a text or a list to be at least that long. An empty value passes: combine it with {@link required}. Sets
 * `tooShort`.
 *
 * @param value - Gives the value to check.
 * @param length - The minimum length, or a function giving it.
 * @param message - The message of the error, the length by default.
 * @returns The validator.
 */
export function minLength(value: () => unknown, length: ValueOrGetter<number>, message?: string): FormValidator {
  return () => {
    const actual = lengthOf(value());
    const minimum = read(length);
    return actual !== undefined && actual > 0 && actual < minimum ? { tooShort: message ?? `The length must be at least ${minimum}.` } : undefined;
  };
}

/**
 * Requires a text or a list to be at most that long. Sets `tooLong`.
 *
 * @param value - Gives the value to check.
 * @param length - The maximum length, or a function giving it.
 * @param message - The message of the error, the length by default.
 * @returns The validator.
 */
export function maxLength(value: () => unknown, length: ValueOrGetter<number>, message?: string): FormValidator {
  return () => {
    const actual = lengthOf(value());
    const maximum = read(length);
    return actual !== undefined && actual > maximum ? { tooLong: message ?? `The length must be at most ${maximum}.` } : undefined;
  };
}

/**
 * Requires a number to be at least that. An empty value, or one that is not a number, passes: combine it with
 * {@link required}. Sets `rangeUnderflow`.
 *
 * @param value - Gives the value to check.
 * @param limit - The minimum, or a function giving it.
 * @param message - The message of the error, the minimum by default.
 * @returns The validator.
 */
export function min(value: () => unknown, limit: ValueOrGetter<number>, message?: string): FormValidator {
  return () => {
    const actual = toNumber(value());
    const minimum = read(limit);
    return actual !== undefined && actual < minimum ? { rangeUnderflow: message ?? `The value must be at least ${minimum}.` } : undefined;
  };
}

/**
 * Requires a number to be at most that. An empty value, or one that is not a number, passes. Sets `rangeOverflow`.
 *
 * @param value - Gives the value to check.
 * @param limit - The maximum, or a function giving it.
 * @param message - The message of the error, the maximum by default.
 * @returns The validator.
 */
export function max(value: () => unknown, limit: ValueOrGetter<number>, message?: string): FormValidator {
  return () => {
    const actual = toNumber(value());
    const maximum = read(limit);
    return actual !== undefined && actual > maximum ? { rangeOverflow: message ?? `The value must be at most ${maximum}.` } : undefined;
  };
}

/**
 * Requires a text to match a pattern. A text pattern must match the whole value, as the `pattern` of a field does; a
 * regular expression is used as it is, anchored or not, and its `lastIndex` is reset so a global one gives the same
 * answer each time. An empty value passes. Sets `patternMismatch`.
 *
 * @param value - Gives the value to check.
 * @param pattern - The pattern, or a function giving it.
 * @param message - The message of the error.
 * @returns The validator.
 */
export function pattern(value: () => unknown, pattern: ValueOrGetter<RegExp | string>, message = 'The value does not match the expected format.'): FormValidator {
  return () => {
    const actual = value();
    if (isEmpty(actual)) {
      return undefined;
    }

    const source = read(pattern);
    const expression = typeof source === 'string' ? new RegExp(`^(?:${source})$`) : source;
    expression.lastIndex = 0;
    return expression.test(String(actual)) ? undefined : { patternMismatch: message };
  };
}

/**
 * Requires a text to be an email address, as the HTML specification defines it. An empty value passes. Sets
 * `typeMismatch`.
 *
 * @param value - Gives the value to check.
 * @param message - The message of the error.
 * @returns The validator.
 */
export function email(value: () => unknown, message = 'Enter a valid email address.'): FormValidator {
  return () => {
    const actual = value();
    return isEmpty(actual) || EMAIL.test(String(actual)) ? undefined : { typeMismatch: message };
  };
}
