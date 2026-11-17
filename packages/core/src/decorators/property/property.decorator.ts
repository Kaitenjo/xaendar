import { AccessorDecorator, ClassAccessorDecoratorValue, DecoratorMetadataContext, Function } from '@xaendar/types';
import { PROPERTY_DECORATOR_OPTIONS_WITH_REQUIRED_BRAND } from '../../costants';
import { input } from '../../signals/input/input';
import { INPUT_SIGNAL_SET_SYMBOL } from '../../signals/input/input-set.symbol';
import { InputSignal } from '../../signals/types/input-signal.type';
import { SettableInputSignal } from '../../signals/types/settable-input-signal.type';
import type { BindingHost } from '../../types/binding-host.type';
import type { PropertyDecoratorOptionsWithRequired } from '../../types/property-decorator-options-with-required.type';
import { PropertyDecoratorOptions } from '../../types/property-decorator-options.type';
import type { InputAlias } from '../../types/property/input-alias.type';
import type { PropertyDecoratorOptionsWithRequiredBrandType } from '../../types/property/property-decorator-options-with-required-brand-type.type';
import type { PropertyOptionsArgument } from '../../types/property/property-options-argument.type';
import { PropertyDecoratorReturnType } from '../../types/property/property-return-type.type';
import type { WithAlias } from '../../types/property/with-alias.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { registerInput } from '../../utils/input-registration/input-registration.util';

/**
 * Creates the input signal of an accessor decorated with `@Property`.
 *
 * @param value - The default value of the input.
 * @param options - The options of the input: equality, watched and unwatched callbacks, transform.
 * @returns The input signal, holding the default value.
 */
function createInput<ActualValue, IncomingValue>(value: ActualValue | undefined, options: PropertyDecoratorOptions<ActualValue, IncomingValue> | undefined): SettableInputSignal<ActualValue, IncomingValue> {
  return input<ActualValue, IncomingValue>(value, {
    equals: options?.equals,
    watched: options?.watched,
    unwatched: options?.unwatched,
    transform: options?.transform
  }) as SettableInputSignal<ActualValue, IncomingValue>;
}

/**
 * Creates the decorator of an input, optional or required.
 *
 * The input signal of an instance is created lazily, the first time the accessor is read or assigned, and kept in the
 * storage of the accessor, so an instance whose input is never read allocates no signal. Only an element holding a value
 * assigned before its upgrade creates it at once, in `init`, to take that value.
 *
 * N.B. The signal is kept in the private storage the `accessor` already has for each instance. Do not keep it in a
 * variable of the decorator, which runs once per class: every instance would share one signal.
 *
 * @param value - The default value of the input, or the options of a required input (`@Property.required`).
 * @param options - The options of an optional input.
 * @returns The accessor decorator.
 */
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
      init(value: Value): Value {
        /*
          A value assigned to the element before its upgrade is an own property, which would shadow the accessor until
          the input is created: the input is created at once, only then, and the value written into it as any later
          assignment, so the transform applies to it and the default stays the initial value a reset goes back to.
        */
        if (!Object.hasOwn(this, propertyKey)) {
          return value;
        }

        const element = this as unknown as Record<string, IncomingValue>;
        const preUpgrade = element[propertyKey];
        delete element[propertyKey];
        const signal = createInput(actualValue, actualOptions);
        signal.set(preUpgrade, INPUT_SIGNAL_SET_SYMBOL);

        return signal as unknown as Value;
      },
      get(): Value {
        let signal = target.get.call(this);
        if (!signal) {
          signal = createInput(actualValue, actualOptions) as unknown as Value;
          target.set.call(this, signal);
        }

        return signal;
      },
      set(newValue: IncomingValue): void {
        const signal = context.access.get(this) as unknown as SettableInputSignal<ActualValue, IncomingValue>;
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