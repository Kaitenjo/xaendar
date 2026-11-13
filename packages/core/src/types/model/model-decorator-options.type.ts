import type { EventOptions } from '../../models/event-options/event-options';
import type { PropertyDecoratorOptions } from '../property-decorator-options.type';

/**
 * The options of `@Model` and of `@Model.required`: the ones of `@Property` but the `transform`, since the value goes
 * both ways, plus the options of the event of change.
 *
 * @template Value - The type of the value of the model.
 * @template Alias - The alias of the model, which the type of the accessor declares (see `Aliased`): the event of change
 *   is named after it.
 */
export type ModelDecoratorOptions<Value = unknown, Alias extends string = string> = Omit<PropertyDecoratorOptions<Value, Value, Alias>, 'transform'> & {
  /**
   * The options every event of change is dispatched with (bubbles, cancelable, composed): by default it neither bubbles
   * nor crosses the shadow root, as an `@Event` without options.
   */
  event?: Partial<EventOptions>;
};
