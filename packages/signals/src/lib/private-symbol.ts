/**
 * Symbol not available in public API, 
 * used to call internal methods of `State` and `Computed` from `Watcher` without exposing them in the public API.
 * 
 * @internal
 */
export const PRIVATE = Symbol('signals-private');

export function assertPrivateContext(symbol: Symbol): void {
  if (symbol !== PRIVATE) {
    throw new Error('Invalid symbol');
  }
}