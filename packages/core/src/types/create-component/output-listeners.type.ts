import type { OutputListener } from './output-listener.type';
import type { OutputName } from './output-name.type';

/**
 * The listeners of the outputs of a component or of a directive, by the name of their `@Event` accessor.
 *
 * Written as a mapped type over `keyof Target`, filtering the names in the `as` clause: this form lets TypeScript give the
 * listeners their type while it infers the type of a directive from its entry.
 *
 * @template Target - The component or the directive declaring the outputs.
 */
export type OutputListeners<Target> = {
  [Name in keyof Target as OutputName<Target, Name>]?: OutputListener<Target[Name]>
};
