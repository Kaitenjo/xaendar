import type { NoArgsVoidFunction } from '@xaendar/types';

/**
 * A component created by `createComponent` of `CustomElement` or of `CustomDirective`.
 *
 * @template Component - The created component.
 */
export type ComponentRef<Component> = {
  /**
   * The element of the component, mounted in the target.
   */
  readonly element: Component,
  /**
   * Destroys the component ahead of the component or of the directive creating it: unbinds its inputs and its events, destroys
   * its directives and removes its element from the target. Calling it again, or after its creator is destroyed, does nothing.
   */
  destroy: NoArgsVoidFunction
};
