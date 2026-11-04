import type { PROPERTY_DECORATOR_OPTIONS_WITH_REQUIRED_BRAND } from '../../costants';
import type { PropertyDecoratorOptionsWithRequired } from '../property-decorator-options-with-required.type';

/**
 * The options `Property.required` passes to the decorator it creates, branded so that the decorator tells them apart from
 * a default value.
 *
 * @template ActualValue - The type of the value of the input.
 * @template IncomingValue - The type of the values assigned to the input, before its `transform`.
 */
export type PropertyDecoratorOptionsWithRequiredBrandType<ActualValue = unknown, IncomingValue = ActualValue> = PropertyDecoratorOptionsWithRequired<ActualValue, IncomingValue> & {
  /**
   * The brand.
   */
  [PROPERTY_DECORATOR_OPTIONS_WITH_REQUIRED_BRAND]: 'PropertyDecoratorOptionsWithRequired'
};
