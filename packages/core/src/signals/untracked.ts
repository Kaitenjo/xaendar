import type { NoArgsFunction } from '@xaendar/types';

/**
 * Executes a function without tracking any dependencies.
 * `Signal` is read when it is called, so the modules importing it can be loaded before the signals are.
 * @param fn - The function to execute without tracking.
 * @returns The result of the function execution.
 */
export function untracked<Value>(fn: NoArgsFunction<Value>): Value {
  return Signal.subtle.untrack(fn);
}
