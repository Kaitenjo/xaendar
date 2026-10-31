import type { RenderElementAttribute } from './render-element-attribute.type';
import type { RenderElementDirective } from './render-element-directive.type';
import type { RenderElementEvent } from './render-element-event.type';
import type { RenderConditionalBinding } from './render-conditional-binding.type';

/**
 * Describes a single conditional binding to be attached to a rendered element.
 */
export type RenderElementConditionalBinding = RenderConditionalBinding<{
  /**
   * The list of attributes to be applied to the element while the branch is selected.
   */
  attributes: RenderElementAttribute[],
  /**
   * The list of event listeners to be attached to the element while the branch is selected.
   */
  events: RenderElementEvent[],
  /**
   * The list of nested conditional bindings to be attached to the element while the branch is selected.
   */
  conditionalBindings: RenderElementConditionalBinding[],
  /**
   * The list of directives to be applied to the element while the branch is selected.
   */
  directives: RenderElementDirective[]
}>
