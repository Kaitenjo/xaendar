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
  /**
   * Reflects the input on an attribute of the host element, as `@HostAttribute` does: `true` names the attribute after
   * the input, its alias or the name of its property in kebab-case (`showValue` → `show-value`), a string names it.
   * A boolean adds the attribute empty or removes it (`"true"` or `"false"` on `aria-*` and the enumerated attributes),
   * `null` and `undefined` remove it, any other value is written as a string. Only the input writes the attribute:
   * the attribute never writes the input. A structural directive, which holds no element, cannot reflect its inputs.
   */
  reflect?: boolean | string;
}
