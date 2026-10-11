import { AccessorDecorator, ClassAccessorDecoratorValue, Function } from '@xaendar/types';
import type { EventHost } from '../../types/event/event-host.type';
import { EventDecoratorReturnType } from '../../types/event/event-return-type.type';
import { Output } from '../../types/event/output.type';
import { EventOptions } from '../../models/event-options/event-options';

/**
 * Merges the options of an emission over the default ones of the output. The options are read
 * through their getters, since spreading an `EventOptions` would copy its private fields.
 *
 * @param options - The default options of the output.
 * @param overrideOptions - The options of the emission, which win over the default ones they set.
 * @returns The options to dispatch the event with.
 */
function mergeOptions(options?: Partial<EventOptions>, overrideOptions?: EventOptions): EventInit {
  return {
    bubbles: overrideOptions?.bubbles ?? options?.bubbles,
    cancelable: overrideOptions?.cancelable ?? options?.cancelable,
    composed: overrideOptions?.composed ?? options?.composed
  };
}

/**
 * Decorator that declares a custom event output on a web component or a custom directive.
 * A structural directive cannot declare it, since it holds no element to dispatch the event on.
 *
 * Transforms the decorated accessor into an {@link Output} object whose
 * `emit` method dispatches a `CustomEvent` on the host element (for a directive, the element it is applied to). The event
 * name is derived from the accessor name, and the provided `options`
 * (bubbles, cancelable, composed) are used as defaults that can be
 * overridden per-emission.
 *
 * @param options - Default `CustomEvent` options for every emission. An emission overrides them
 *   by passing an {@link EventOptions}.
 * @returns An accessor decorator that replaces the field with an `Output`.
 *
 * @example
 * ```ts
 * @Event({ bubbles: true })
 * accessor clicked: Output<MouseEvent>;
 * ```
 */
export function Event<
  Data = void,
>(options?: Partial<EventOptions>): Function<Parameters<AccessorDecorator<EventHost, Output<Data>>>, EventDecoratorReturnType<EventHost, Output<Data>>> {
  return (_value: ClassAccessorDecoratorValue<Output<Data>>, context: ClassAccessorDecoratorContext<EventHost, Output<Data>>): EventDecoratorReturnType<EventHost, Output<Data>> => {
    const name = context.name;

    if (typeof name === 'symbol') {
      throw new Error('Symbol properties are not supported as event names');
    }

    return {
      init(): Output<Data> {
        return {
          emit: (valueOrOverrideOptions?: Data | EventOptions, overrideOptions?: EventOptions) => {
            const eventOptions: CustomEventInit<Data> = valueOrOverrideOptions instanceof EventOptions
              ? mergeOptions(options, valueOrOverrideOptions)
              : { ...mergeOptions(options, overrideOptions), detail: valueOrOverrideOptions };

            const event = new CustomEvent(name, eventOptions);
            this.dispatchEvent(event);
          }
        };
      }
    }
  }
}
