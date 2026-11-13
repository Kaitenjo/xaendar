import { _bindSite } from '../../signals/effect/effect';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import type { TemplateExpression } from '../../types/template-expression.type';
import { setStyle, unsetStyle } from '../class-toggle/class-toggle.util';
import { COMPONENT } from '../../costants';
import type { _Context } from '../../types/context.type';

/**
 * Sets a style property of an element by the value of an expression reading nothing that can change, once: a literal,
 * e.g. `<div [style.width.px]="{ 120 }"></div>`, or any expression on the server, which reads every value once. It is
 * the callback of the binding of {@link _setReactiveStyle} too.
 *
 * The value is written as a string followed by the unit of the binding, if any (`[style.width.px]` writes `120px`):
 * `null`, `undefined` and `false` remove the property instead.
 *
 * @param context - The current template execution scope, which the expression reads.
 * @param element - The element to set the property on.
 * @param binding - The style binding: the name of the property, its unit, if any, and the expression giving its value.
 */
export function _setExpressionStyle(context: _Context, element: Element, binding: RenderElementAttribute): void {
  const value = (binding.value as TemplateExpression<unknown>).call(context[COMPONENT], context);
  setStyle(element, binding.name, value === null || value === undefined || value === false ? null : `${value}${binding.unit ?? ''}`);
}

/**
 * Sets a style property of an element by the value of an expression, again whenever a signal or a variable of the
 * template it reads changes (see `_bindSite`), its callback being {@link _setExpressionStyle}. E.g.,
 * `<div [style.color]="{ color() }"></div>`.
 *
 * @param context - The current template execution scope, which the expression reads and which disposes the binding.
 * @param element - The element to set the property on.
 * @param binding - The style binding: the name of the property, its unit, if any, the expression giving its value, and
 *   the identifiers of the variables of the template it reads, if any.
 */
export function _setReactiveStyle(context: _Context, element: Element, binding: RenderElementAttribute): void {
  _bindSite(context, binding, element, _setExpressionStyle);
}

/**
 * Removes a style property set on an element, when the branch of the conditional binding setting it is no longer
 * selected.
 *
 * @param _context - The current template execution scope.
 * @param element - The element to remove the property from.
 * @param binding - The style binding.
 */
export function _removeStyle(_context: _Context, element: Element, binding: RenderElementAttribute): void {
  unsetStyle(element, binding.name);
}
