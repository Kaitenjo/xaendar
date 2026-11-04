import { AccessorDecorator, ClassAccessorDecoratorValue, DecoratorMetadataContext, Function } from '@xaendar/types';
import { INTERNAL_ALIAS_TO_ATTRIBUTE, PROPERTY_DECORATOR_OPTIONS_WITH_REQUIRED_BRAND } from '../../costants';
import type { BindingHost } from '../../types/binding-host.type';
import { input } from '../../signals/input/input';
import { InputSignal } from '../../signals/types/input-signal.type';
import { PropertyDecoratorOptions } from '../../types/property-decorator-options.type';
import type { PropertyDecoratorOptionsWithRequired } from '../../types/property-decorator-options-with-required.type';
import { PropertyDecoratorReturnType } from '../../types/property/property-return-type.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { INPUT_SIGNAL_SET_SYMBOL } from '../../signals/input/input-set.symbol';
import { SettableInputSignal } from '../../signals/types/settable-input-signal.type';
import type { PropertyDecoratorOptionsWithRequiredBrandType } from '../../types/property/property-decorator-options-with-required-brand-type.type';

function createPropertyDecorator<
  Class extends BindingHost,
  Value extends InputSignal<ActualValue>,
  ActualValue = unknown,
  IncomingValue = ActualValue
>(
  value?: ActualValue | PropertyDecoratorOptionsWithRequiredBrandType<ActualValue, IncomingValue>,
  options?: PropertyDecoratorOptions<ActualValue, IncomingValue>
): Function<Parameters<AccessorDecorator<Class, Value, WebComponentMetadata>>, PropertyDecoratorReturnType<Class, Value, IncomingValue>> {
  return function (
    target: ClassAccessorDecoratorValue<Value>,
    context: DecoratorMetadataContext<ClassAccessorDecoratorContext<Class, Value>, WebComponentMetadata>
  ): PropertyDecoratorReturnType<Class, Value, IncomingValue> {
    const propertyKey = context.name;

    if (typeof propertyKey === 'symbol') {
      throw new Error('Symbol properties are not supported');
    }

    let actualValue: ActualValue | undefined;
    let actualOptions: PropertyDecoratorOptions<ActualValue, IncomingValue> | undefined | PropertyDecoratorOptionsWithRequiredBrandType<ActualValue, IncomingValue> | undefined;
    if (!value || typeof value !== 'object' || !(PROPERTY_DECORATOR_OPTIONS_WITH_REQUIRED_BRAND in value)) {
      actualValue = value;
      actualOptions = options;
    } else {
      actualOptions = value;
    }

    const metadata = context.metadata;
    const attributeName = actualOptions?.alias ?? propertyKey;
    /*
      The metadata of a subclass inherits from the one of its parent class: the map of the parent is copied into the
      metadata of the class, so the inputs of the parent stay visible and the ones of the class do not reach the parent.
    */
    if (!Object.hasOwn(metadata, INTERNAL_ALIAS_TO_ATTRIBUTE)) {
      metadata[INTERNAL_ALIAS_TO_ATTRIBUTE] = Object.assign({}, metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]);
    }
    metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]![attributeName] = propertyKey;

    return {
      init(_?: InputSignal<ActualValue>) {
        const signal = input<ActualValue, IncomingValue>(actualValue, {
          equals: actualOptions?.equals,
          watched: actualOptions?.watched,
          unwatched: actualOptions?.unwatched,
          transform: actualOptions?.transform
        }) as SettableInputSignal<ActualValue, IncomingValue>;
        /*
          A value assigned to the element before its upgrade is an own property, which would shadow the accessor:
          it is removed and written into the input as any later assignment, so the transform applies to it and the
          default stays the initial value a reset goes back to.
        */
        if (Object.hasOwn(this, propertyKey)) {
          const element = this as unknown as Record<string, IncomingValue>;
          const preUpgrade = element[propertyKey];
          delete element[propertyKey];
          signal.set(preUpgrade, INPUT_SIGNAL_SET_SYMBOL);
        }

        return signal as Value;
      },
      set(newValue: IncomingValue) {
        const signal = target.get.call(this) as SettableInputSignal<ActualValue, IncomingValue>;
        signal.set(newValue, INPUT_SIGNAL_SET_SYMBOL);
      }
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
 * \@Property()
 * accessor label: InputSignal<string>;
 *
 * \@Property(0)
 * accessor count: InputSignal<number>;
 * ```
 */
export function Property<
  Value extends InputSignal<ActualValue>,
  IncomingValue = Value extends InputSignal<infer U> ? U : unknown,
  ActualValue = Value extends InputSignal<infer U> ? U : unknown
>(
  value?: ActualValue,
  options?: PropertyDecoratorOptions<ActualValue, IncomingValue>
): Function<Parameters<AccessorDecorator<BindingHost, InputSignal<ActualValue>, WebComponentMetadata>>, PropertyDecoratorReturnType<BindingHost, InputSignal<ActualValue>, IncomingValue>> {
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
 * \@Property.required()
 * accessor userId: InputSignal<string>;
 *
 * \@Property.required({ alias: 'user-id' })
 * accessor userId: InputSignal<string>;
 * ```
 */
Property.required = function required<
  ActualValue = unknown,
  IncomingValue = ActualValue
>(
  options?: Omit<PropertyDecoratorOptionsWithRequired<ActualValue, IncomingValue>, 'required'>
): Function<Parameters<AccessorDecorator<BindingHost, InputSignal<ActualValue>, WebComponentMetadata>>, PropertyDecoratorReturnType<BindingHost, InputSignal<ActualValue>, IncomingValue>>{
  return createPropertyDecorator<BindingHost, InputSignal<ActualValue>, ActualValue, IncomingValue>({
    ...options,
    [PROPERTY_DECORATOR_OPTIONS_WITH_REQUIRED_BRAND]: 'PropertyDecoratorOptionsWithRequired',
    required: true,
  });
};