import { AccessorDecorator, ClassAccessorDecoratorValue, DecoratorMetadataContext, Function } from '@xaendar/types';
import { EventOptions } from '../../models/event-options/event-options';
import { Output } from '../../models/output/output';
import type { EventHost } from '../../types/event/event-host.type';
import { EventDecoratorReturnType } from '../../types/event/event-return-type.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { registerEvent } from '../../utils/event-registration/event-registration.util';

/**
 * Merges the options of a dispatch over the default ones of the output. The options are read
 * through their getters, since spreading an `EventOptions` would copy its private fields.
 *
 * @param options - The default options of the output.
 * @param overrideOptions - The options of the dispatch, which win over the default ones they set.
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
 * Creates the output of an instance: its `dispatch` dispatches a `CustomEvent` named after the accessor on the host.
 *
 * @param host - The component or the custom directive declaring the output.
 * @param name - The name of the event, the name of the accessor.
 * @param options - The default options of every dispatch.
 * @returns The output of the instance.
 */
function createOutput<Data>(host: EventHost, name: string, options: Partial<EventOptions> | undefined): Output<Data> {
  return new Output<Data>((valueOrOverrideOptions?: Data | EventOptions, overrideOptions?: EventOptions) => {
    const eventOptions: CustomEventInit<Data> = valueOrOverrideOptions instanceof EventOptions
      ? mergeOptions(options, valueOrOverrideOptions)
      : { ...mergeOptions(options, overrideOptions), detail: valueOrOverrideOptions };

    host.dispatchEvent(new CustomEvent(name, eventOptions));
  });
}

/**
 * Decorator that declares a custom event output on a web component or a custom directive.
 * A structural directive cannot declare it, since it holds no element to dispatch the event on.
 *
 * Transforms the decorated accessor into an {@link Output} object whose
 * `dispatch` method dispatches a `CustomEvent` on the host element (for a directive, the element it is applied to). The event
 * name is derived from the accessor name, and the provided `options`
 * (bubbles, cancelable, composed) are used as defaults that can be
 * overridden per dispatch.
 *
 * The output of an instance is created lazily, the first time the accessor is read, and kept in the storage of the accessor.
 * The name of the event is registered in the metadata of the class, so that a component exposing it for a host directive
 * does not read the accessor.
 *
 * N.B. The output is kept in the private storage the `accessor` already has for each instance. Do not keep it in a
 * variable of the decorator, which runs once per class: every instance would share one output, dispatching on one element.
 *
 * @param options - Default `CustomEvent` options for every dispatch. A dispatch overrides them
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
>(options?: Partial<EventOptions>): Function<Parameters<AccessorDecorator<EventHost, Output<Data>, WebComponentMetadata>>,EventDecoratorReturnType<EventHost, Output<Data>>> {
  return (target: ClassAccessorDecoratorValue<Output<Data>>, context: DecoratorMetadataContext<ClassAccessorDecoratorContext<EventHost, Output<Data>>, WebComponentMetadata>): EventDecoratorReturnType<EventHost, Output<Data>> => {
    const name = context.name;

    if (typeof name === 'symbol') {
      throw new Error('Symbol properties are not supported as event names');
    }

    registerEvent(context.metadata, name);

    return {
      get(): Output<Data> {
        let output = target.get.call(this);
        if (!output) {
          output = createOutput<Data>(this, name, options);
          target.set.call(this, output);
        }

        return output;
      }
    };
  };
}
