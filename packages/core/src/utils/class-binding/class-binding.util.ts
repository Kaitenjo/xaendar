import type { NoArgsFunction } from '@xaendar/types';
import { _bindEffect } from '../../signals/effect/effect';
import { toggleClass, untoggleClass } from '../class-toggle/class-toggle.util';
import type { _Context } from '../context/context.util';

/**
 * Toggles a class on an element by the value of an expression reading nothing that can change, once: a literal, e.g.
 * `<div [class.active]="{ true }"></div>`, or any expression on the server, which reads every value once.
 *
 * @param _context - The current template execution scope.
 * @param element - The element to toggle the class on.
 * @param name - The name of the class.
 * @param value - A function returning the value: the element has the class when it is truthy.
 */
export function _setExpressionClass(_context: _Context, element: Element, name: string, value: NoArgsFunction<unknown>): void {
  toggleClass(element, name, !!value());
}

/**
 * Toggles a class on an element by the value of an expression, again whenever a signal or a variable of the template it
 * reads changes (see `_bindEffect`). E.g., `<div [class.active]="{ isActive() }"></div>`.
 *
 * @param context - The current template execution scope, which disposes the binding.
 * @param element - The element to toggle the class on.
 * @param name - The name of the class.
 * @param value - A function returning the value: the element has the class when it is truthy.
 * @param reads - The names of the variables of the template the expression reads, omitted when it reads none.
 */
export function _setReactiveClass(context: _Context, element: Element, name: string, value: NoArgsFunction<unknown>, reads?: readonly string[]): void {
  _bindEffect(context, toggleReactiveClass, element, name, value, reads);
}

/**
 * Toggles a class on an element by the value of an expression: the callback of the binding of
 * {@link _setReactiveClass}, shared by every class binding.
 *
 * @param element - The element to toggle the class on.
 * @param name - The name of the class.
 * @param value - A function returning the value: the element has the class when it is truthy.
 */
function toggleReactiveClass(element: Element, name: string, value: NoArgsFunction<unknown>): void {
  toggleClass(element, name, !!value());
}

/**
 * Removes a class toggled on an element, when the branch of the conditional binding toggling it is no longer selected.
 *
 * @param _context - The current template execution scope.
 * @param element - The element to remove the class from.
 * @param name - The name of the class.
 */
export function _removeClass(_context: _Context, element: Element, name: string): void {
  untoggleClass(element, name);
}
