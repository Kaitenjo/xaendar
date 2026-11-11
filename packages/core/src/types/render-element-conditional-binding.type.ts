import type { RenderElementAttribute } from './render-element-attribute.type';
import type { RenderElementDirective } from './render-element-directive.type';
import type { RenderElementEvent } from './render-element-event.type';
import type { RenderConditionalBinding } from './render-conditional-binding.type';

/**
 * Describes a single conditional binding to be attached to a rendered element. The lists a branch does not declare are
 * left out.
 */
export type RenderElementConditionalBinding = RenderConditionalBinding<{
  /**
   * The list of attributes to be applied to the element while the branch is selected.
   */
  readonly attributes?: readonly RenderElementAttribute[];
  /**
   * The list of event listeners to be attached to the element while the branch is selected.
   */
  readonly events?: readonly RenderElementEvent[];
  /**
   * The list of nested conditional bindings to be attached to the element while the branch is selected.
   */
  readonly conditionalBindings?: readonly RenderElementConditionalBinding[];
  /**
   * The list of directives to be applied to the element while the branch is selected.
   */
  readonly directives?: readonly RenderElementDirective[];
}>;
