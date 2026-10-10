import { AccessorDecorator, ClassAccessorDecoratorValue, Function } from '@xaendar/types';
import type { EventHost } from '../../types/event/event-host.type';
import { EventOptions } from '../../types/event/event-options.type';
import { EventDecoratorReturnType } from '../../types/event/event-return-type.type';
import { Output } from '../../types/event/output.type';

/**
 * The keys of the options of an event.
 */
const EVENT_OPTION_KEYS: ReadonlyArray<string> = ['bubbles', 'cancelable', 'composed'] satisfies Array<keyof EventOptions>;

/**
 * Tells whether the only argument of an emission is the options of the event: an object holding
 * nothing but option keys. Any other value, an object with another key included, is the detail.
 *
 * @param value - The only argument of the emission.
 * @returns `true` if the value is the options of the event, `false` if it is its detail.
 */
function isEventOptions(value: EventOptions | unknown): value is EventOptions {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const keys = Object.keys(value);
  return !!keys.length && keys.every(key => EVENT_OPTION_KEYS.includes(key));
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
 * @param options - Default `CustomEvent` options for every emission. At
 *   least one of `bubbles`, `cancelable`, or `composed` must be specified.
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
>(options?: EventOptions): Function<Parameters<AccessorDecorator<EventHost, Output<Data>>>, EventDecoratorReturnType<EventHost, Output<Data>>> {
  return (_value: ClassAccessorDecoratorValue<Output<Data>>, context: ClassAccessorDecoratorContext<EventHost, Output<Data>>): EventDecoratorReturnType<EventHost, Output<Data>> => {
    const name = context.name;

    if (typeof name === 'symbol') {
      throw new Error('Symbol properties are not supported as event names');
    }

    return {
      init(): Output<Data> {
        return {
          emit: (...args: [valueOrOverrideOptions?: Data | EventOptions, overrideOptions?: EventOptions]) => {
            const [valueOrOverrideOptions, overrideOptions] = args;
            // With two arguments the first one is always the detail: the options come second
            const eventOptions: CustomEventInit<Data> = args.length === 1 && isEventOptions(valueOrOverrideOptions)
              ? { ...options, ...valueOrOverrideOptions }
              : { ...options, ...overrideOptions, detail: valueOrOverrideOptions as Data };

            const event = new CustomEvent(name, eventOptions);
            this.dispatchEvent(event);
          }
        };
      }
    }
  }
}
