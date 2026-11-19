import type { ModelChangeName } from './model-change-name.type';

/**
 * The value of the model of a component or of a directive dispatching an event of change: the detail of the event.
 *
 * @template Target - The component or the directive declaring the model.
 * @template Event - The name of the event of change (see {@link ModelChangeName}).
 */
export type ModelChangeValue<Target, Event extends string> = {
  [Name in keyof Target]-?: Event extends ModelChangeName<Target, Name> ? Target[Name] extends () => infer Value ? Value : never : never
}[keyof Target];