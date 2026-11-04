import type { RenderConditionalBinding } from '../render-conditional-binding.type';
import type { RenderElementDirective } from '../render-element-directive.type';

/**
 * The bindings of the component element, or of a directive applied to it, collected from the groups of its inputs and of its events:
 * the bindings of an element and of a directive at once, so that they fit both.
 */
export type Bindings = Pick<RenderElementDirective, 'attributes' | 'events'> & {
  /**
   * The groups bound only while their condition holds, each one an `@if` with a single branch.
   */
  conditionalBindings: RenderConditionalBinding<Bindings>[],
  /**
   * The directives applied as long as the component lives: always empty for a directive, which applies none.
   */
  directives: RenderElementDirective[]
};
