import { InputSignalOptions } from '../signals/types/input-signal.options.type';

/**
 * Parameters accepted by the `@property` decorator.
 *
 * Extends {@link InputSignalOptions} with an optional `alias` (the attribute name
 * to observe) and a mandatory `value` (the default value of the property).
 *
 * @template IncomingValue - The raw type received from outside (e.g. from an attribute). Defaults to `ActualValue`.
 * @template ActualValue - The internal type stored by the signal. Defaults to `unknown`.
 */
export type PropertyDecoratorOptions<ActualValue = unknown, IncomingValue = ActualValue> = InputSignalOptions<ActualValue, IncomingValue> & {
  /** 
   * The attribute name to observe. Defaults to the property name when omitted. 
   */
  alias?: string;
}
