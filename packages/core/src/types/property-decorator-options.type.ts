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
   * `null` and `undefined` remove it, any other value is written as a string. The attribute writes the input only when
   * `attribute` asks it. A structural directive, which holds no element, cannot reflect its inputs.
   */
  reflect?: boolean | string;
  /**
   * Lets an attribute of the element of the component write the input, as the attributes of a native element write
   * its properties: `true` names the attribute after the input, its alias or the name of its property in kebab-case
   * (`showValue` → `show-value`), a string names it, a function names it so and converts its text into the value the
   * input takes. Without a function the text is converted from the type of the default value: a boolean is `true`
   * while the attribute is present, whatever its text, a number is `Number(text)`, a string the text itself; an input
   * without such a default, or with a `transform`, needs the function. A removed attribute resets the input to its
   * default. Only a component reads it, as `observedAttributes`: the inputs of a directive are bound by the templates.
   */
  attribute?: boolean | string | ((value: string) => IncomingValue);
}
