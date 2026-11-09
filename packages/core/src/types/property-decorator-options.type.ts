import { InputSignalOptions } from '../signals/types/input-signal.options.type';

/**
 * Parameters accepted by the `@property` decorator.
 *
 * Extends {@link InputSignalOptions} with an optional `alias` (the attribute name
 * to observe) and a mandatory `value` (the default value of the property).
 *
 * @template IncomingValue - The raw type received from outside (e.g. from an attribute). Defaults to `ActualValue`.
 * @template ActualValue - The internal type stored by the signal. Defaults to `unknown`.
 * @template Alias - The alias of the input, which the type of the accessor declares (see `Aliased`).
 */
export type PropertyDecoratorOptions<ActualValue = unknown, IncomingValue = ActualValue, Alias extends string = string> = InputSignalOptions<ActualValue, IncomingValue> & {
  /**
   * The name the templates, `createComponent` and `renderToString` bind the input with, in place of the name of its
   * property. The type of the accessor declares it too: `Aliased<InputSignal<T>, 'alias'>`.
   */
  alias?: Alias;
}
