import type { Constructor } from '@xaendar/types';
import type { CustomDirective } from '../models/custom-directive/custom-directive';
import type { RenderConditionalBinding } from './render-conditional-binding.type';
import type { RenderElementAttribute } from './render-element-attribute.type';
import type { RenderElementEvent } from './render-element-event.type';

/**
 * Describes a single directive to be applied to a rendered element, e.g. `<div @@selector(name="value" (event)="handler()") />`.
 * The lists it does not declare are left out.
 */
export type RenderElementDirective = {
  /**
   * The selector the directive is registered with, or the class of the directive, when it is applied by `createComponent`.
   */
  readonly selector: string | Constructor<CustomDirective>;
  /**
   * The position of the directive among the ones the element applies, in the order they appear, its conditional
   * bindings included (see `DIRECTIVE_ORDER`): left out for the first one, and for an element applying one directive.
   */
  readonly order?: number;
  /**
   * The list of directive properties to be bound: the attributes of an element, except the ones
   * unbound by removing the attribute, since a directive has no underlying attribute to remove.
   */
  readonly attributes?: readonly RenderElementAttribute[];
  /**
   * The list of event listeners to be attached: the events of a directive are listened to on the element the directive is applied to.
   */
  readonly events?: readonly RenderElementEvent[];
  /**
   * The list of conditional bindings binding the directive properties and events only while one of their branches is selected:
   * a branch holds the same bindings the directive does, so it is unable to apply further directives.
   */
  readonly conditionalBindings?: ReadonlyArray<RenderConditionalBinding<Pick<RenderElementDirective, 'attributes' | 'events' | 'conditionalBindings'>>>;
};
