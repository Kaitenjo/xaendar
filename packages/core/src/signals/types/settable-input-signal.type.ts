import { InputSignal } from './input-signal.type';

/**
 * An `InputSignal` with the internal methods the template runtime changes its value with,
 * both callable only with the internal set symbol.
 */
export type SettableInputSignal = InputSignal & {
  /**
   * Sets a new value, after applying the `transform` of the input.
   *
   * @param newValue - The incoming value.
   * @param symbol - The internal set symbol.
   */
  set: (newValue: unknown, symbol: symbol) => void,
  /**
   * Sets the initial value back, without applying the `transform` of the input.
   *
   * @param symbol - The internal set symbol.
   */
  reset: (symbol: symbol) => void
};
