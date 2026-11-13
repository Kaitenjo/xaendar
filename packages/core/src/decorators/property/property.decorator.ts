import { AccessorDecorator, ClassAccessorDecoratorValue, DecoratorMetadataContext, Function } from '@xaendar/types';
import { PROPERTY_DECORATOR_OPTIONS_WITH_REQUIRED_BRAND } from '../../costants';
import { registerInput } from '../../utils/input-registration/input-registration.util';
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
import type { InputAlias } from '../../types/property/input-alias.type';
import type { WithAlias } from '../../types/property/with-alias.type';
import type { PropertyOptionsArgument } from '../../types/property/property-options-argument.type';

function createPropertyDecorator<
  Class extends BindingHost,
  Value extends InputSignal<ActualValue, IncomingValue>,
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
    const required = !!value && typeof value === 'object' && PROPERTY_DECORATOR_OPTIONS_WITH_REQUIRED_BRAND in value;
    if (!required) {
      actualValue = value;
      actualOptions = options;
    } else {
      actualOptions = value;
    }

    registerInput(context.metadata, propertyKey, actualOptions?.alias, required);

    return {
      init(_?: InputSignal<ActualValue, IncomingValue>) {
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
 * With an `alias`, the accessor declares it in its type (`Aliased<InputSignal<T>, 'alias'>`), or the decorator does not
 * compile: `createComponent` and `renderToString` bind the input by it.
 *
 * @example
 * ```ts
 * \@Property()
 * accessor label: InputSignal<string>;
 *
 * \@Property(0)
 * accessor count: InputSignal<number>;
 *
 * \@Property('', { alias: 'user-id' })
 * accessor userId: Aliased<InputSignal<string>, 'user-id'>;
 * ```
 */
export function Property<
  Value extends InputSignal<ActualValue, IncomingValue>,
  IncomingValue = Value extends InputSignal<unknown, infer In> ? In : unknown,
  ActualValue = Value extends InputSignal<infer U, unknown> ? U : unknown,
  Alias extends string = InputAlias<Value>
>(
  value?: ActualValue,
  ...[options]: PropertyOptionsArgument<PropertyDecoratorOptions<ActualValue, IncomingValue, Alias>, Alias>
): Function<Parameters<AccessorDecorator<BindingHost, WithAlias<InputSignal<ActualValue, IncomingValue>, Alias>, WebComponentMetadata>>, PropertyDecoratorReturnType<BindingHost, WithAlias<InputSignal<ActualValue, IncomingValue>, Alias>, IncomingValue>> {
  return createPropertyDecorator<BindingHost, WithAlias<InputSignal<ActualValue, IncomingValue>, Alias>, ActualValue, IncomingValue>(value, options);
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
 * accessor userId: Aliased<InputSignal<string>, 'user-id'>;
 * ```
 */
Property.required = function required<
  ActualValue = unknown,
  IncomingValue = ActualValue,
  Alias extends string = never
>(
  ...[options]: PropertyOptionsArgument<Omit<PropertyDecoratorOptionsWithRequired<ActualValue, IncomingValue, Alias>, 'required'>, Alias>
): Function<Parameters<AccessorDecorator<BindingHost, WithAlias<InputSignal<ActualValue, IncomingValue>, Alias>, WebComponentMetadata>>, PropertyDecoratorReturnType<BindingHost, WithAlias<InputSignal<ActualValue, IncomingValue>, Alias>, IncomingValue>>{
  return createPropertyDecorator<BindingHost, WithAlias<InputSignal<ActualValue, IncomingValue>, Alias>, ActualValue, IncomingValue>({
    ...options,
    [PROPERTY_DECORATOR_OPTIONS_WITH_REQUIRED_BRAND]: 'PropertyDecoratorOptionsWithRequired',
    required: true,
  });
};