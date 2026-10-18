import type { NoArgsFunction } from '@xaendar/types';
import { effect } from '../../signals/effect/effect';
import { toggleClass, untoggleClass } from '../class-toggle/class-toggle.util';
import type { _Context } from '../context/context.util';

/**
 * Toggles a class on an element by the value of a non-reactive expression, once.
 * E.g., `<div [class.active]="{ isActive }"></div>`.
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
 * Toggles a class on an element by the value of a reactive expression, again whenever it changes.
 * E.g., `<div [class.active]="{ isActive() }"></div>`.
 *
 * @param context - The current template execution scope, which disposes the effect.
 * @param element - The element to toggle the class on.
 * @param name - The name of the class.
 * @param value - A function returning the value: the element has the class when it is truthy.
 */
export function _setReactiveClass(context: _Context, element: Element, name: string, value: NoArgsFunction<unknown>): void {
  context.addUnlistener(effect(() => toggleClass(element, name, !!value())));
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
