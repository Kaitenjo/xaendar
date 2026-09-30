import { NoArgsFunction } from '@xaendar/types'
import type { RenderElementAttribute } from './render-element-attribute.type'
import type { RenderElementDirective } from './render-element-directive.type'
import type { RenderElementEvent } from './render-element-event.type'

/**
 * Describes a single conditional binding to be attached to a rendered element.
 */
export type RenderElementConditionalBinding = {
  /**
   * The condition expression that determines whether the conditional binding should be applied.
   */
  condition: NoArgsFunction<boolean>,
  /**
   * The list of attributes to be applied to the element when the conditional binding is applied.
   */
  attributes: RenderElementAttribute[],
  /**
   * The list of event listeners to be attached to the element when the conditional binding is applied.
   */
  events: RenderElementEvent[],
  /**
   * The list of nested conditional bindings to be applied to the element when the parent conditional binding is applied.
   */
  conditionalBindings: RenderElementConditionalBinding[],
  /**
   * The list of directives to be applied to the element while the conditional binding is applied.
   */
  directives: RenderElementDirective[]
}