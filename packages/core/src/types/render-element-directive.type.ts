import type { _resetProperty } from '../utils';
import type { RenderConditionalBinding } from './render-conditional-binding.type';
import type { RenderElementAttribute } from './render-element-attribute.type';
import type { RenderElementEvent } from './render-element-event.type';

/**
 * Describes a single directive to be applied to a rendered element, e.g. `<div @@selector(name="value" (event)="handler()") />`.
 */
export type RenderElementDirective = {
  /**
   * The selector the directive is registered with.
   */
  selector: string,
  /**
   * The list of directive properties to be bound: the attributes of an element, except the ones
   * unbound by removing the attribute, since a directive has no underlying attribute to remove.
   */
  attributes: Array<Omit<RenderElementAttribute, 'unbind'> & { unbind?: typeof _resetProperty }>,
  /**
   * The list of event listeners to be attached: the events of a directive are listened to on the element the directive is applied to.
   */
  events: RenderElementEvent[],
  /**
   * The list of conditional bindings binding the directive properties and events only while one of their branches is selected:
   * a branch holds the same bindings the directive does, so it is unable to apply further directives.
   */
  conditionalBindings: RenderConditionalBinding<Pick<RenderElementDirective, 'attributes' | 'events' | 'conditionalBindings'>>[]
}
