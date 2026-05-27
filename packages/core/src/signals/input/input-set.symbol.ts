/**
 * This symbol is used to call the set method of the InputSignal
 * Normally the set method is permitted internally and should not be called
 * by the User
 */
export const INPUT_SIGNAL_SET_SYMBOL = Symbol(`InputSignalSet`);

/**
 * Asserts that the provided symbol matches the internal {@link INPUT_SIGNAL_SET_SYMBOL} symbol,
 * ensuring the caller has access to internal APIs.
 *
 * Throws if the symbol does not match, preventing external code from
 * invoking methods intended for internal use only.
 *
 * @param symbol - The symbol to validate against {@link INPUT_SIGNAL_SET_SYMBOL}.
 * @throws {Error} If `symbol` does not match {@link INPUT_SIGNAL_SET_SYMBOL}.
 * @internal
 */
export function assertPrivateContext(symbol: symbol): void {
  if (symbol !== INPUT_SIGNAL_SET_SYMBOL) {
    throw new Error('Invalid symbol for InputSignal set method');
  }
}