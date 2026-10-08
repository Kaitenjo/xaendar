import { AccessorDecorator, ClassAccessorDecoratorValue, Function } from '@xaendar/types';
import { INTERNAL_ALIAS_TO_ATTRIBUTE } from '../../costants';
import type { BindingHost } from '../../types/binding-host.type';
import { input } from '../../signals/input/input';
import { InputSignal } from '../../signals/types/input-signal.type';
import { PropertyDecoratorOptions, PropertyDecoratorOptionsWithRequired, } from '../../types/property-decorator-options.type';
import { PropertyDecoratorReturnType } from '../../types/property/property-return-type.type';

const propertyDecoratorOptionsWithRequiredBrand = Symbol('PropertyDecoratorOptionsWithRequiredBrand');
type PropertyDecoratoprOptionsWithRequiredBrandType<ActualValue = unknown, IncomingValue = ActualValue> = PropertyDecoratorOptionsWithRequired<ActualValue, IncomingValue> & {
  [propertyDecoratorOptionsWithRequiredBrand]: 'PropertyDecoratorOptionsWithRequired'
};

function createPropertyDecorator<
  Class extends BindingHost,
  Value extends InputSignal<ActualValue>,
  ActualValue = unknown,
  IncomingValue = ActualValue
>(
  value?: ActualValue | PropertyDecoratoprOptionsWithRequiredBrandType<ActualValue, IncomingValue>,
  options?: PropertyDecoratorOptions<ActualValue, IncomingValue>
): Function<Parameters<AccessorDecorator<Class, Value>>, PropertyDecoratorReturnType<Class, Value>> {
  return function (
    _target: ClassAccessorDecoratorValue<Value>,
    context: ClassAccessorDecoratorContext<Class, Value>
  ): PropertyDecoratorReturnType<Class, Value> {
    const propertyKey = context.name;

    if (typeof propertyKey === 'symbol') {
      throw new Error('Symbol properties are not supported');
    }

    let actualValue: ActualValue | undefined;
    let actualOptions: PropertyDecoratorOptions<ActualValue, IncomingValue> | undefined | PropertyDecoratoprOptionsWithRequiredBrandType<ActualValue, IncomingValue> | undefined;
    if (!value || typeof value !== 'object' || !(propertyDecoratorOptionsWithRequiredBrand in value)) {
      actualValue = value;
      actualOptions = options;
    } else {
      actualOptions = value;
    }

    const metadata = context.metadata as { [INTERNAL_ALIAS_TO_ATTRIBUTE]?: Record<string, string> };
    const attributeName = actualOptions?.alias ?? propertyKey;
    metadata[INTERNAL_ALIAS_TO_ATTRIBUTE] ??= {};
    metadata[INTERNAL_ALIAS_TO_ATTRIBUTE][attributeName] = propertyKey;

    return {
      init(_?: InputSignal<ActualValue>) {
        return input<ActualValue, IncomingValue>(actualValue, {
          equals: actualOptions?.equals,
          watched: actualOptions?.watched,
          unwatched: actualOptions?.unwatched,
          transform: actualOptions?.transform
        }) as Value;
      },
    };
  };
}

/**
 * Decorator that declares an optional input property on a web component or a directive.
 *
 * Transforms the decorated accessor into a reactive {@link InputSignal}
 * bound to the corresponding HTML attribute. An optional default `value`
 * and further configuration can be supplied via `options`.
 *
 * @param value - Optional default value for the property.
 * @param options - Additional configuration (equality function, lifecycle
 *   hooks, attribute alias, transform function).
 * @returns An accessor decorator that replaces the field with an `InputSignal`.
 *
 * @example
 * ```ts
 * @Property()
 * accessor label: InputSignal<string>;
 *
 * @Property(0)
 * accessor count: InputSignal<number>;
 * ```
 */
export function Property<
  Value extends InputSignal<ActualValue>,
  ActualValue = Value extends InputSignal<infer U> ? U : unknown,
  IncomingValue = ActualValue
>(
  value?: ActualValue,
  options?: PropertyDecoratorOptions<ActualValue, IncomingValue>
): Function<Parameters<AccessorDecorator<BindingHost, InputSignal<ActualValue>>>, PropertyDecoratorReturnType<BindingHost, InputSignal<ActualValue>>> {
  return createPropertyDecorator<BindingHost, InputSignal<ActualValue>, ActualValue, IncomingValue>(value, options);
}

/**\
 * Decorator that declares a required input property on a web component or a directive.
 *
 * The consumer must explicitly supply the attribute value; no default is
 * accepted. If the attribute is absent, the signal value will be `undefined`
 * and any transform or default handling is the responsibility of the consumer.
 *
 * @param options - Optional configuration (equality function, lifecycle
 *   hooks, attribute alias, transform function). The `required` flag is
 *   added automatically.
 * @returns An accessor decorator that replaces the field with an `InputSignal`.
 *
 * @example
 * ```ts
 * @Property.required()
 * accessor userId: InputSignal<string>;
 *
 * @Property.required({ alias: 'user-id' })
 * accessor userId: InputSignal<string>;
 * ```
 */
Property.required = function required<
  ActualValue = unknown,
  IncomingValue = ActualValue
>(
  options?: Omit<PropertyDecoratorOptionsWithRequired<ActualValue, IncomingValue>, 'required'>
): Function<Parameters<AccessorDecorator<BindingHost, InputSignal<ActualValue>>>, PropertyDecoratorReturnType<BindingHost, InputSignal<ActualValue>>> {
  return createPropertyDecorator<BindingHost, InputSignal<ActualValue>, ActualValue, IncomingValue>({
    ...options,
    [propertyDecoratorOptionsWithRequiredBrand]: 'PropertyDecoratorOptionsWithRequired',
    required: true,
  });
};