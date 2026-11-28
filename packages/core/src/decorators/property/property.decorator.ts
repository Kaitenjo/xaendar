import { AccessorDecorator, ClassAccessorDecoratorValue, DecoratorMetadataContext, Function } from '@xaendar/types';
import { INITIALIZE, PROPERTY_DECORATOR_OPTIONS_WITH_REQUIRED_BRAND } from '../../costants';
import { StructuralDirective } from '../../models/structural-directive/structural-directive';
import { input } from '../../signals/input/input';
import { INPUT_SIGNAL_SET_SYMBOL } from '../../signals/input/input-set.symbol';
import { InputSignal } from '../../signals/types/input-signal.type';
import { SettableInputSignal } from '../../signals/types/settable-input-signal.type';
import type { BindingHost } from '../../types/binding-host.type';
import type { EventHost } from '../../types/event/event-host.type';
import type { HostAttributeContext } from '../../types/property/host-attribute-context.type';
import type { PropertyDecoratorOptionsWithRequired } from '../../types/property-decorator-options-with-required.type';
import { PropertyDecoratorOptions } from '../../types/property-decorator-options.type';
import type { InputAlias } from '../../types/property/input-alias.type';
import type { PropertyDecoratorOptionsWithRequiredBrandType } from '../../types/property/property-decorator-options-with-required-brand-type.type';
import type { PropertyOptionsArgument } from '../../types/property/property-options-argument.type';
import { PropertyDecoratorReturnType } from '../../types/property/property-return-type.type';
import type { WithAlias } from '../../types/property/with-alias.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { attributeNameOf, registerAttributeInput } from '../../utils/attribute-inputs/attribute-inputs.util';
import { registerInput } from '../../utils/input-registration/input-registration.util';
import { HostAttribute } from '../host-attribute/host-attribute.decorator';

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
 * Reflects an input on an attribute of the host element, declaring the `@HostAttribute` of its accessor: the attribute
 * follows the input with the rules of the host attributes, and the class rejects it when it is a structural directive,
 * which holds no element.
 *
 * @param target - The getter and the setter of the accessor of the input.
 * @param context - The context of the accessor of the input.
 * @param name - The name of the attribute.
 * @throws If the name is empty or names the classes or the style, which `@HostAttribute` binds, or an attribute the
 *   browser runs, and, once an instance is created, if the class is a structural directive.
 */
function reflectInput(target: ClassAccessorDecoratorValue<unknown>, context: HostAttributeContext, name: string): void {
  const propertyKey = String(context.name);
  if (namesStyling(name)) {
    throw new Error(`@Property on ${propertyKey} reflects the input on "${name}": reflect names an attribute, while the classes and the style are bound with @HostAttribute`);
  }

  HostAttribute(name)(target, context);
  context.addInitializer(function (this: EventHost | StructuralDirective): void {
    if (this instanceof StructuralDirective) {
      throw new Error(`@Property on ${propertyKey} of ${this.constructor.name} reflects the input on "${name}": a structural directive holds no element to write the attribute on`);
    }
  });
}

/**
 * Lets an attribute of the element of a component write an input, registering it in the metadata of the class, which
 * `@WebComponent` reads to observe the attribute: the class rejects it when it is not a component, since only a custom
 * element hears its attributes.
 *
 * @param context - The context of the accessor of the input.
 * @param name - The name of the attribute.
 * @param option - The `attribute` option: `true`, the name, or the conversion of the text.
 * @param defaultValue - The default value of the input, `undefined` for a required one.
 * @param transforms - Whether the input declares a `transform`.
 * @param reflects - Whether the input is reflected on the same attribute.
 * @throws If the name names the classes or the style, or the conversion cannot be deduced (see
 *   `registerAttributeInput`), and, once an instance is created, if the class is not a component.
 */
function readFromAttribute(context: ClassAccessorDecoratorContext<BindingHost, unknown> & { metadata: Partial<WebComponentMetadata> }, name: string, option: unknown, defaultValue: unknown, transforms: boolean, reflects: boolean): void {
  const propertyKey = String(context.name);
  if (namesStyling(name)) {
    throw new Error(`@Property on ${propertyKey} is written by the attribute "${name}": the classes and the style are not the attribute of an input`);
  }

  registerAttributeInput(context.metadata, propertyKey, name, option, defaultValue, transforms, reflects);
  context.addInitializer(function (this: BindingHost): void {
    if (!(INITIALIZE in this)) {
      throw new Error(`@Property on ${propertyKey} of ${this.constructor.name} is written by the attribute "${name}": only a component hears its attributes, while the inputs of a directive are bound by the templates`);
    }
  });
}

/**
 * Tells whether a name given to `reflect` or `attribute` names the classes or the style, which are no attribute of an
 * input.
 *
 * @param name - The name.
 * @returns `true` for `class`, `style` and the names starting with `class.` or `style.`.
 */
function namesStyling(name: string): boolean {
  return name === 'class' || name === 'style' || name.startsWith('class.') || name.startsWith('style.');
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
    if (actualOptions?.reflect) {
      const { reflect, alias } = actualOptions;
      reflectInput(target, context as unknown as HostAttributeContext, attributeNameOf(reflect, propertyKey, alias));
    }

    if (actualOptions?.attribute) {
      const { attribute, alias, reflect, transform } = actualOptions;
      const name = attributeNameOf(attribute, propertyKey, alias);
      readFromAttribute(context, name, attribute, actualValue, !!transform, !!reflect && attributeNameOf(reflect, propertyKey, alias) === name);
    }

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
 *
 * // <ex-toggle locked> while locked() is true
 * \@Property(false, { reflect: true })
 * accessor locked: InputSignal<boolean>;
 *
 * // <ex-meter value="3"> in any HTML sets value() to 3
 * \@Property(0, { attribute: true })
 * accessor value: InputSignal<number>;
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