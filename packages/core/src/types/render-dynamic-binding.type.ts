import { NoArgsFunction } from '@xaendar/types'
import type { RenderElementAttribute } from './render-element-attribute.type'
import type { RenderElementEvent } from './render-element-event.type'

/**
 * Describes a single dynamic binding to be attached to a rendered element.
 */
export type RenderElementDynamicBinding = {
  /**
   * The condition expression that determines whether the dynamic binding should be applied.
   */
  condition: NoArgsFunction<boolean>,
  /**
   * The list of attributes to be applied to the element when the dynamic binding is applied.
   */
  attributes: RenderElementAttribute[],
  /**
   * The list of event listeners to be attached to the element when the dynamic binding is applied.
   */
  events: RenderElementEvent[],
  /**
   * The list of nested dynamic bindings to be applied to the element when the parent dynamic binding is applied.
   */
  dynamicBindings: RenderElementDynamicBinding[]
}