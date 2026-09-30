import type { _removeAttribute } from '../utils';
import type { RenderElementConditionalBinding } from './render-conditional-binding.type';
import type { RenderElementAttribute } from './render-element-attribute.type';

/**
 * Describes a single directive to be applied to a rendered element, e.g. `<div @@selector(name="value" @event="handler()") />`.
 *
 * The events are the ones of a conditional binding: they are listened to on the element the directive is applied to.
 */
export type RenderElementDirective = Pick<RenderElementConditionalBinding, 'events'> & {
  /**
   * The selector the directive is registered with.
   */
  selector: string,
  /**
   * The list of directive properties to be bound: the attributes of an element, except the ones
   * unbound by removing the attribute, since a directive has no underlying attribute to remove.
   */
  attributes: Exclude<RenderElementAttribute, { unbind: typeof _removeAttribute }>[],
  /**
   * The list of conditional bindings binding the directive properties and events only while their condition holds:
   * the conditional bindings of an element, bound to the directive properties and unable to apply further directives.
   */
  conditionalBindings: (Omit<RenderElementConditionalBinding, 'attributes' | 'conditionalBindings' | 'directives'> & Pick<RenderElementDirective, 'attributes' | 'conditionalBindings'>)[]
}
