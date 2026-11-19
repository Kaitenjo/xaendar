import type { ModelChangeListeners } from './model-change-listeners.type';
import type { OutputListener } from './output-listener.type';
import type { OutputName } from './output-name.type';

/**
 * The listeners of the outputs of a component or of a directive, by the name of their `@Event` accessor, and of the
 * events of change of its models (see {@link ModelChangeListeners}).
 *
 * Written as a mapped type over `keyof Target`, filtering the names in the `as` clause: this form lets TypeScript give the
 * listeners their type while it infers the type of a directive from its entry. The events of change are a mapped type
 * of their own, intersected: renaming the keys in the same `as` clause would lose the type of every listener.
 *
 * @template Target - The component or the directive declaring the outputs and the models.
 */
export type OutputListeners<Target> = {
  [Name in keyof Target as OutputName<Target, Name>]?: OutputListener<Target[Name]>
} & ModelChangeListeners<Target>;