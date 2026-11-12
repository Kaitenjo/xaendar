import { _bindEffect } from '../../signals/effect/effect';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import type { TemplateExpression } from '../../types/template-expression.type';
import { toggleClass, untoggleClass } from '../class-toggle/class-toggle.util';
import { COMPONENT } from '../../costants';
import type { _Context } from '../../types/context.type';

/**
 * Toggles a class on an element by the value of an expression reading nothing that can change, once: a literal, e.g.
 * `<div [class.active]="{ true }"></div>`, or any expression on the server, which reads every value once.
 *
 * @param context - The current template execution scope, which the expression reads.
 * @param element - The element to toggle the class on.
 * @param binding - The class binding: the name of the class and the expression whose value, when truthy, gives the
 *   element the class.
 */
export function _setExpressionClass(context: _Context, element: Element, binding: RenderElementAttribute): void {
  toggleReactiveClass(element, binding, context);
}

/**
 * Toggles a class on an element by the value of an expression, again whenever a signal or a variable of the template it
 * reads changes (see `_bindEffect`). E.g., `<div [class.active]="{ isActive() }"></div>`.
 *
 * @param context - The current template execution scope, which the expression reads and which disposes the binding.
 * @param element - The element to toggle the class on.
 * @param binding - The class binding: the name of the class, the expression whose value, when truthy, gives the element
 *   the class, and the identifiers of the variables of the template it reads, if any.
 */
export function _setReactiveClass(context: _Context, element: Element, binding: RenderElementAttribute): void {
  _bindEffect(context, toggleReactiveClass, element, binding, context, binding.reads);
}

/**
 * Toggles a class on an element by the value of an expression: the callback of the binding of
 * {@link _setReactiveClass}, shared by every class binding.
 *
 * @param element - The element to toggle the class on.
 * @param binding - The class binding.
 * @param context - The context the binding lives in, which the expression reads.
 */
function toggleReactiveClass(element: Element, binding: RenderElementAttribute, context: _Context): void {
  toggleClass(element, binding.name, !!(binding.value as TemplateExpression<unknown>).call(context[COMPONENT], context));
}

/**
 * Removes a class toggled on an element, when the branch of the conditional binding toggling it is no longer selected.
 *
 * @param _context - The current template execution scope.
 * @param element - The element to remove the class from.
 * @param binding - The class binding.
 */
export function _removeClass(_context: _Context, element: Element, binding: RenderElementAttribute): void {
  untoggleClass(element, binding.name);
}
