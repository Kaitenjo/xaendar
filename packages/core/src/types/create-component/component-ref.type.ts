import type { NoArgsVoidFunction } from '@xaendar/types';

/**
 * A component created by `createComponent`.
 *
 * @template Component - The created component.
 */
export type ComponentRef<Component> = {
  /**
   * The element of the component, mounted in the target.
   */
  readonly element: Component,
  /**
   * Destroys the component: unbinds its inputs and its events, destroys its directives and removes its element from the target.
   */
  destroy: NoArgsVoidFunction
};
