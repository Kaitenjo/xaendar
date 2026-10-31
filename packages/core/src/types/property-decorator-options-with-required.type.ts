import type { PropertyDecoratorOptions } from './property-decorator-options.type';

/**
 * Variant of {@link PropertyDecoratorOptions} that marks the property as required.
 *
 * When `required` is `true`, the component will expect the attribute/input to be
 * explicitly provided by the consumer.
 *
 * @template IncomingValue - The raw type received from outside. Defaults to `ActualValue`.
 * @template ActualValue - The internal type stored by the signal. Defaults to `unknown`.
 */
export type PropertyDecoratorOptionsWithRequired<ActualValue = unknown, IncomingValue = ActualValue> = PropertyDecoratorOptions<ActualValue, IncomingValue> & {
  /**
   * Indicates that the property is required. When `true`, the component will expect the attribute/input to be explicitly provided by the consumer.
   */
  required: true;
}
