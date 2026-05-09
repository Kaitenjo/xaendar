/**
 * Symbol not available in public API,
 * used to call internal methods of `State` and `Computed` from `Watcher` without exposing them in the public API.
 *
 * @internal
 */
export const PRIVATE = Symbol('signals-private');

/**
 * Asserts that the provided symbol matches the internal {@link PRIVATE} symbol,
 * ensuring the caller has access to internal APIs.
 *
 * Throws if the symbol does not match, preventing external code from
 * invoking methods intended for internal use only.
 *
 * @param symbol - The symbol to validate against {@link PRIVATE}.
 * @throws {Error} If `symbol` does not match {@link PRIVATE}.
 * @internal
 */
export function assertPrivateContext(symbol: symbol): void {
  if (symbol !== PRIVATE) {
    throw new Error('Invalid symbol');
  }
}