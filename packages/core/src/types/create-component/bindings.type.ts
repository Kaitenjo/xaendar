import type { RenderConditionalBinding } from '../render-conditional-binding.type';
import type { RenderElementAttribute } from '../render-element-attribute.type';
import type { RenderElementDirective } from '../render-element-directive.type';
import type { RenderElementEvent } from '../render-element-event.type';

/**
 * The bindings of the component element, or of a directive applied to it, collected from the groups of its inputs and of its events:
 * the bindings of an element and of a directive at once, so that they fit both.
 */
export type Bindings = {
  /**
   * The inputs bound, by the name of their property.
   */
  attributes: RenderElementAttribute[];
  /**
   * The listeners.
   */
  events: RenderElementEvent[];
  /**
   * The groups bound only while their condition holds, each one an `@if` with a single branch.
   */
  conditionalBindings: Array<RenderConditionalBinding<Bindings>>;
  /**
   * The directives applied as long as the component lives: always empty for a directive, which applies none.
   */
  directives: RenderElementDirective[];
};
