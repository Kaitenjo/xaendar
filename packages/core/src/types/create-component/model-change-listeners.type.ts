import type { Function } from '@xaendar/types';
import type { ModelChangeName } from './model-change-name.type';
import type { ModelChangeValue } from './model-change-value.type';

/**
 * The listeners of the events of change of the models of a component or of a directive, by the name of the model
 * followed by `Change` (see {@link ModelChangeName}): each one receives the event, whose detail is the new value.
 *
 * Written as a mapped type over the names of the events, not over `keyof Target` renaming the keys in an `as` clause:
 * that form loses the type of the listeners while TypeScript infers the type of the component from the class passed to
 * `createComponent`.
 *
 * @template Target - The component or the directive declaring the models.
 */
export type ModelChangeListeners<Target> = {
  [Event in ModelChangeName<Target, keyof Target>]?: Function<[event: CustomEvent<ModelChangeValue<Target, Event>>], unknown>
};