import { toModelChangeEvent } from '@xaendar/common';
import type { AccessorDecorator, ClassAccessorDecoratorValue, DecoratorMetadataContext, Function } from '@xaendar/types';
import { INPUT_SIGNAL_SET_SYMBOL } from '../../signals/input/input-set.symbol';
import { createModelPrototype, model } from '../../signals/model/model';
import type { ModelSignal } from '../../signals/types/model-signal.type';
import type { SettableInputSignal } from '../../signals/types/settable-input-signal.type';
import type { EventHost } from '../../types/event/event-host.type';
import type { ModelChange } from '../../types/model/model-change.type';
import type { ModelDecoratorOptions } from '../../types/model/model-decorator-options.type';
import type { InputAlias } from '../../types/property/input-alias.type';
import type { PropertyDecoratorReturnType } from '../../types/property/property-return-type.type';
import type { PropertyOptionsArgument } from '../../types/property/property-options-argument.type';
import type { WithAlias } from '../../types/property/with-alias.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { registerInput } from '../../utils/input-registration/input-registration.util';

/**
 * Creates the decorator of a model, for `@Model` and `@Model.required`.
 *
 * @param value - The initial value of the model, `undefined` for a required one.
 * @param options - The options of the model.
 * @param required - Whether the model is required.
 * @returns The decorator, replacing the field with a `ModelSignal`.
 * @throws When the decorated accessor is named by a symbol.
 */
function createModelDecorator<Value extends ModelSignal<ActualValue>, ActualValue>(
  value: ActualValue | undefined,
  options: ModelDecoratorOptions<ActualValue> | undefined,
  required: boolean
): Function<Parameters<AccessorDecorator<EventHost, Value, WebComponentMetadata>>, PropertyDecoratorReturnType<EventHost, Value, ActualValue>> {
  return function (
    target: ClassAccessorDecoratorValue<Value>,
    context: DecoratorMetadataContext<ClassAccessorDecoratorContext<EventHost, Value>, WebComponentMetadata>
  ): PropertyDecoratorReturnType<EventHost, Value, ActualValue> {
    const propertyKey = context.name;
    if (typeof propertyKey === 'symbol') {
      throw new Error('Symbol properties are not supported');
    }

    const alias = options?.alias;
    registerInput(context.metadata, propertyKey, alias, required);
    // The equality compares values of any model of the accessor: its type of value is the one the prototype keeps
    const equals = (options?.equals ?? Object.is) as unknown as ModelChange['equals'];
    const prototype = createModelPrototype(value, { name: toModelChangeEvent(alias ?? propertyKey), event: options?.event, equals });

    return {
      init(_?: Value): Value {
        const signal = model<ActualValue>(prototype, this, options) as unknown as SettableInputSignal<ActualValue>;
        // A value assigned to the element before its upgrade is written into the model quietly, as any later assignment
        if (Object.hasOwn(this, propertyKey)) {
          const element = this as unknown as Record<string, ActualValue>;
          const preUpgrade = element[propertyKey];
          delete element[propertyKey];
          signal.set(preUpgrade, INPUT_SIGNAL_SET_SYMBOL);
        }

        return signal as unknown as Value;
      },
      set(newValue: ActualValue): void {
        const signal = target.get.call(this) as unknown as SettableInputSignal<ActualValue>;
        signal.set(newValue, INPUT_SIGNAL_SET_SYMBOL);
      }
    };
  };
}

/**
 * Decorator that declares a model on a web component or a custom directive: an input the class can also write, the
 * input of a two-way binding (`[(value)]="signal"`).
 *
 * Transforms the decorated accessor into a {@link ModelSignal}. The parent sets it as any input, quietly; the class
 * changes it with `set` or `update`, which dispatch on the host element (for a directive, the element it is applied
 * to), when the value differs from the current one, the event of change: a `CustomEvent` named after the model followed
 * by `Change` (`valueChange`, after the alias when the model declares one), whose `detail` is the new value. A template
 * binds both with `[(value)]="signal"`, or listens to the event alone with `(valueChange)="…"`. A structural directive
 * cannot declare it, since it holds no element to dispatch the event on.
 *
 * It has the options of `@Property` but the `transform`, since the value goes both ways, plus `event`, the options of
 * the event of change (`bubbles`, `cancelable`, `composed`). With an `alias`, the accessor declares it in its type
 * (`Aliased<ModelSignal<T>, 'alias'>`), or the decorator does not compile.
 *
 * @param value - The initial value of the model.
 * @param options - Additional configuration (equality function, lifecycle hooks, alias, options of the event of change).
 * @returns An accessor decorator that replaces the field with a `ModelSignal`.
 *
 * @example
 * ```ts
 * \@Model(0)
 * public accessor value!: ModelSignal<number>;
 *
 * public increment(): void {
 *   this.value.update(value => value + 1); // dispatches valueChange
 * }
 * ```
 */
export function Model<
  Value extends ModelSignal<ActualValue>,
  ActualValue = Value extends ModelSignal<infer Actual> ? Actual : unknown,
  Alias extends string = InputAlias<Value>
>(
  value?: ActualValue,
  ...[options]: PropertyOptionsArgument<ModelDecoratorOptions<ActualValue, Alias>, Alias>
): Function<Parameters<AccessorDecorator<EventHost, WithAlias<ModelSignal<ActualValue>, Alias>, WebComponentMetadata>>, PropertyDecoratorReturnType<EventHost, WithAlias<ModelSignal<ActualValue>, Alias>, ActualValue>> {
  return createModelDecorator<WithAlias<ModelSignal<ActualValue>, Alias>, ActualValue>(value, options, false);
}

/**
 * Decorator that declares a required model on a web component or a custom directive: a {@link Model} the parent must
 * bind, which has no initial value.
 *
 * @param options - Optional configuration (equality function, lifecycle hooks, alias, options of the event of change).
 * @returns An accessor decorator that replaces the field with a `ModelSignal`.
 *
 * @example
 * ```ts
 * \@Model.required()
 * public accessor checked!: ModelSignal<boolean>;
 * ```
 */
Model.required = function required<
  ActualValue = unknown,
  Alias extends string = never
>(
  ...[options]: PropertyOptionsArgument<ModelDecoratorOptions<ActualValue, Alias>, Alias>
): Function<Parameters<AccessorDecorator<EventHost, WithAlias<ModelSignal<ActualValue>, Alias>, WebComponentMetadata>>, PropertyDecoratorReturnType<EventHost, WithAlias<ModelSignal<ActualValue>, Alias>, ActualValue>> {
  return createModelDecorator<WithAlias<ModelSignal<ActualValue>, Alias>, ActualValue>(undefined, options, true);
};
