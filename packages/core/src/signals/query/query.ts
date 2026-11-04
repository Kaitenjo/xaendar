import type { Constructor, NoArgsVoidFunction } from '@xaendar/types';
import { CONNECTED_HOOKS, DISCONNECTED_HOOKS } from '../../costants';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { CustomElement } from '../../models/custom-element/custom-element';
import { _getAppliedDirectives } from '../../utils/applied-directives/applied-directives.util';
import { _getElementRef } from '../../utils/element-refs/element-refs.util';
import { getSelector } from '../../utils/get-selector/get-selector.util';
import type { QueryMatcher } from '../types/query-matcher.type';
import type { QueryRead } from '../types/query-read.type';
import type { QuerySignal } from '../types/query-signal.type';
import type { QuerySlotOptions } from '../types/query-slot-options.type';
import type { QueryTarget } from '../types/query-target.type';

/**
 * Resolves how a query finds what it looks for: the elements its target matches, and what it holds for each of them.
 *
 * @param target - A CSS selector (a tag name, `.class`, `[attribute]`, a combination of them...), the class of a
 *   web component decorated with `@WebComponent`, or the class of a custom directive.
 * @param read - What the query holds for each element found: the element itself (`'element'`), or the instances of a
 *   custom directive applied to it. By default the element, or the instances of the directive the target is.
 * @returns The matcher: the elements matching the selector itself, the ones matching the selector a component is
 *   registered with, or the ones a directive is applied to, mapped to what is read from them.
 * @throws When the target is a class neither decorated with `@WebComponent` nor extending `CustomDirective`.
 */
export function toMatcher(target: QueryTarget, read?: QueryRead): QueryMatcher {
  if (typeof target === 'string') {
    return withRead({ selector: target, description: describe(target, read) }, read);
  }

  if (isDirectiveClass(target)) {
    const description = describe(target.name, read);
    // By default the instances of the directive, otherwise the elements it is applied to, mapped to what is read
    return read === undefined
      ? { selector: '*', description, pick: elements => getDirectives(elements, target) }
      : withRead({ selector: '*', description, pick: elements => elements.filter(element => _getAppliedDirectives(element, target) !== undefined) }, read);
  }

  const selector = getSelector(target);
  return withRead({ selector, description: describe(selector, read) }, read);
}

/**
 * Resolves how a query finds the elements an element ref names, and what it holds for each of them: the ref names
 * one element, or one in each row of a `@for`.
 *
 * @param name - The name of the ref, without the `#`.
 * @param read - What the query holds for each element: the element itself (`'element'`, the default), or the
 *   instances of a custom directive applied to it.
 * @returns The matcher of the elements named by the ref, mapped to what is read from them.
 */
export function toRefMatcher(name: string, read?: QueryRead): QueryMatcher {
  return withRead({
    selector: '*',
    description: describe(`#${name}`, read),
    pick: elements => elements.filter(element => _getElementRef(element) === name)
  }, read);
}

/**
 * Describes what a query looks for, as the error messages write it.
 *
 * @param target - What the target finds: a selector, the class of a directive or `#ref`.
 * @param read - What the query reads from the elements, if the options say it.
 * @returns The description, naming what is read too.
 */
function describe(target: string, read: QueryRead | undefined): string {
  if (read === undefined) {
    return target;
  }

  return `${target}, read: ${read === 'element' ? read : read.name}`;
}

/**
 * Makes a matcher of elements hold what is read from each of them.
 *
 * @param matcher - The matcher of the elements.
 * @param read - What is read: the instances of a directive applied to each element; `undefined` and `'element'` keep
 *   the elements.
 * @returns The matcher holding what is read.
 */
function withRead(matcher: QueryMatcher, read: QueryRead | undefined): QueryMatcher {
  if (read === undefined || read === 'element') {
    return matcher;
  }

  const { selector, description, pick } = matcher;
  return { selector, description, pick: elements => getDirectives(pick ? pick(elements) as Element[] : elements, read) };
}

/**
 * Tells whether the class a query looks for is a custom directive, rather than a web component.
 *
 * @param target - The class.
 * @returns `true` if the class extends `CustomDirective`.
 */
function isDirectiveClass(target: Exclude<QueryTarget, string>): target is Constructor<CustomDirective> {
  return target.prototype instanceof CustomDirective;
}

/**
 * Collects the instances of a custom directive applied to some elements, as host directives or by a template.
 *
 * @param elements - The elements, in order.
 * @param Directive - The class of the directive.
 * @returns The instances, in the order of the elements.
 */
function getDirectives(elements: Element[], Directive: Constructor<CustomDirective>): CustomDirective[] {
  const retVal = new Array<CustomDirective>();
  for (let i = 0; i < elements.length; i++) {
    const directives = _getAppliedDirectives(elements[i], Directive);
    if (directives?.length) {
      retVal.push(...directives);
    }
  }

  return retVal;
}

/**
 * Starts observing the Shadow DOM of the element, invoking `update` each time its tree changes.
 *
 * @param element - The component whose Shadow DOM is observed.
 * @param update - Invoked on each change.
 * @returns A function that stops the observation.
 */
function observeShadowRoot(element: CustomElement, update: NoArgsVoidFunction): NoArgsVoidFunction {
  const mutationObserver = new MutationObserver(update);
  mutationObserver.observe(element.shadowRoot!, { childList: true, subtree: true });
  return () => mutationObserver.disconnect();
}

/**
 * Creates a signal holding the result of `read`, kept up to date while the element is connected:
 * it is read again each time the element is inserted into the DOM, right after the render,
 * and recomputed each time `observe` reports a change. The observation is stopped each time
 * the element is removed from the DOM.
 *
 * @template Value - The type of the queried value.
 * @param element - The component whose DOM is queried.
 * @param read - Reads the current value, receiving the Shadow DOM of the element.
 * @param initialValue - The value held until the element is connected for the first time.
 * @param equals - Tells whether two values are equal, to avoid notifying when the result didn't change.
 * @param observe - Starts observing the changes that may alter the value, and returns a function that stops it.
 *   Defaults to observing the Shadow DOM tree.
 * @returns A {@link QuerySignal} instance.
 */
export function createQuerySignal<Value>(
  element: CustomElement,
  read: (shadowRoot: ShadowRoot) => Value,
  initialValue: Value,
  equals?: (a: Value, b: Value) => boolean,
  observe: (element: CustomElement, update: NoArgsVoidFunction) => NoArgsVoidFunction = observeShadowRoot
): QuerySignal<Value> {
  const signal = new Signal.State<Value>(initialValue, { equals });
  const shadowRoot = element.shadowRoot!;
  const getter = function () { return signal.get(); }
  const update = () => signal.set(read(shadowRoot));

  let stop: NoArgsVoidFunction;
  element[CONNECTED_HOOKS].push(() => {
    stop = observe(element, update);
    update();
  });
  element[DISCONNECTED_HOOKS].push(() => stop());

  return Object.assign(getter, {
    get: signal.get.bind(signal)
  });
}

/**
 * Creates a signal holding a value computed from what a matcher finds in the content projected into the element (or
 * in its whole light DOM, with the `lightDom` option), kept up to date while the element is connected.
 *
 * @template Item - The type of what the matcher finds: the matching elements, or the instances of a directive.
 * @template Value - The type of the queried value.
 * @param element - The component whose projected content is queried.
 * @param matcher - How the query finds what it looks for, see {@link toMatcher}.
 * @param options - Restricts the query to some slots, or extends it to the whole light DOM.
 * @param map - Computes the value from what the matcher finds, in order.
 * @param initialValue - The value held until the element is connected for the first time.
 * @param equals - Tells whether two values are equal, to avoid notifying when the result didn't change.
 * @returns A {@link QuerySignal} instance.
 */
export function createSlotQuerySignal<Item, Value>(
  element: CustomElement,
  matcher: QueryMatcher,
  options: QuerySlotOptions,
  map: (items: Item[]) => Value,
  initialValue: Value,
  equals?: (a: Value, b: Value) => boolean
): QuerySignal<Value> {
  const { selector, pick } = matcher;
  const read = (elements: Element[]) => map((pick ? pick(elements) : elements) as Item[]);
  return options.lightDom
    ? createQuerySignal(element, () => read(Array.from(element.querySelectorAll(selector))), initialValue, equals, observeLightDom)
    : createQuerySignal(element, shadowRoot => read(getProjectedElements(shadowRoot, selector, options.slots)), initialValue, equals, observeProjection);
}

/**
 * Starts observing the light DOM of the element, invoking `update` each time its tree changes.
 *
 * @param element - The component whose light DOM is observed.
 * @param update - Invoked on each change.
 * @returns A function that stops the observation.
 */
function observeLightDom(element: CustomElement, update: NoArgsVoidFunction): NoArgsVoidFunction {
  const mutationObserver = new MutationObserver(update);
  mutationObserver.observe(element, { childList: true, subtree: true });
  return () => mutationObserver.disconnect();
}

/**
 * Starts observing the content projected into the slots of the element, invoking `update` each time it may change:
 * when the light DOM tree or the `slot` attribute of its elements change, when the slots of the Shadow DOM
 * are added, removed or renamed, and when their assigned nodes change.
 *
 * @param element - The component whose projected content is observed.
 * @param update - Invoked on each change.
 * @returns A function that stops the observation.
 */
function observeProjection(element: CustomElement, update: NoArgsVoidFunction): NoArgsVoidFunction {
  const shadowRoot = element.shadowRoot!;
  const mutationObserver = new MutationObserver(update);
  mutationObserver.observe(element, { childList: true, subtree: true, attributeFilter: ['slot'] });
  mutationObserver.observe(shadowRoot, { childList: true, subtree: true, attributeFilter: ['name'] });
  shadowRoot.addEventListener('slotchange', update);

  return () => {
    mutationObserver.disconnect();
    shadowRoot.removeEventListener('slotchange', update);
  };
}

/**
 * Finds the elements projected into the slots of a Shadow DOM matching a selector, together with their
 * matching descendants, in order: slots in tree order, then assigned elements in assignment order.
 * Nested slots are flattened, and the fallback content of the slots is ignored.
 *
 * @param shadowRoot - The Shadow DOM whose slots are inspected.
 * @param selector - The CSS selector the elements must match.
 * @param slots - The name of the slot to inspect, or the names of the slots, the empty string for the default slot. When omitted, all the slots are inspected.
 * @returns The matching elements.
 */
function getProjectedElements(shadowRoot: ShadowRoot, selector: string, slots?: string | string[]): Element[] {
  const match = typeof slots === 'object' ? (item: HTMLSlotElement) => slots.includes(item.name) : (item: HTMLSlotElement) => item.name === slots;
  let retVal = Array.from(shadowRoot.querySelectorAll('slot'))
  if (slots !== undefined) {
    retVal = retVal.filter(match);
  }

  return retVal.flatMap(item => item.assignedElements({ flatten: true }))
    .filter(assigned => assigned.getRootNode() !== shadowRoot)
    .flatMap(assigned => {
      const retVal = [...assigned.querySelectorAll(selector)];
      if (assigned.matches(selector)) {
        retVal.unshift(assigned);
      }
      return retVal;
    });
}