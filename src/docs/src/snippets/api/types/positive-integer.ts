import type { PositiveInteger } from '@xaendar/types';

/**
 * Repeats a text.
 *
 * @param text - The text to repeat.
 * @param count - How many times: a literal must be an integer, zero or more.
 * @returns The text, repeated.
 */
function repeat<Count extends number>(text: string, count: PositiveInteger<Count>): string {
  return text.repeat(count);
}

repeat('ab', 3);     // 'ababab'
repeat('ab', 0);     // '': zero is accepted
repeat('ab', -1);    // ✗ Argument of type '-1' is not assignable to parameter of type 'never'.
repeat('ab', 1.5);   // ✗ Argument of type '1.5' is not assignable to parameter of type 'never'.
repeat('ab', times); // ✓ a number that is not a literal is not checked
