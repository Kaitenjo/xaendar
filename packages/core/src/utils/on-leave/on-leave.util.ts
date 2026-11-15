import { _getComponentRuntime } from '../component-runtime/component-runtime.util';

/**
 * Registers on an element the function the runtime calls when it is about to remove it, so that the element can leave
 * with an animation: the element stays in the DOM until the promise the function returns settles, then it is removed.
 * A second registration on the same element replaces the first one.
 *
 * Call it while a directive starts, in its `onInit`, on the element of the directive (`this.element`): the runtime then
 * knows the scope of the element, so that only the scopes holding such elements do more work when they are cleared.
 * Registered elsewhere, every scope reads the function of its nodes from then on, which is slower, never wrong.
 *
 * What waits, and what does not:
 * - only an element at the top of the block an `@if`, an `@switch`, a `@for` or a structural directive removes waits:
 *   the elements inside it, and the blocks beside it, leave with it, without their function being called;
 * - a component destroyed, or a block the scope holding it removes, removes its elements at once, the ones still
 *   leaving included, without calling any function;
 * - everything else of the block (effects, bindings, listeners, directives, the blocks inside it) is disposed at once,
 *   and the queries stop finding the element at once: only its node waits;
 * - the block goes on as if the element were gone: a branch selected meanwhile is inserted at its place, the rows of a
 *   `@for` are placed and inserted ignoring it, and a key coming back gets a new row. Several copies of a branch may leave
 *   at once.
 *
 * A function returning no promise lets the element go at once. One throwing, or returning a promise that rejects, lets
 * it go too, its error reported as the one of an effect. One never settling keeps the element at most `LEAVE_TIMEOUT`
 * milliseconds (5 seconds). On the server it does nothing, and the hydration is not affected.
 *
 * @example
 * ```ts
 * public onInit(): void {
 *   onLeave(this.element, element => element.animate({ opacity: [1, 0] }, 200).finished.then(() => undefined));
 * }
 * ```
 *
 * @param element - The element.
 * @param handler - The function, receiving the element: a promise settling once the element can be removed, nothing
 *   to remove it at once.
 */
export function onLeave(element: Element, handler: (element: Element) => Promise<void> | void): void {
  _getComponentRuntime().onLeave(element, handler);
}
