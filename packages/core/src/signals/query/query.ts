import type { NoArgsVoidFunction } from '@xaendar/types';
import { CONNECTED_HOOKS, DISCONNECTED_HOOKS } from '../../costants';
import type { CustomElement } from '../../models/custom-element/custom-element';
import { getSelector } from '../../utils/get-selector/get-selector.util';
import type { QuerySignal } from '../types/query-signal.type';
import type { QuerySlotOptions } from '../types/query-slot-options.type';
import type { QueryTarget } from '../types/query-target.type';

/**
 * Resolves the CSS selector matching the elements a query looks for.
 *
 * @param target - A CSS selector (a tag name, `.class`, `[attribute]`, a combination of them...),
 *   or the class of a web component decorated with `@WebComponent`.
 * @returns The string itself when the target is a CSS selector, the selector the component is registered with for a class.
 * @throws When the target is a class not decorated with `@WebComponent`.
 */
export function toSelector(target: QueryTarget): string {
  return typeof target === 'string' ? target : getSelector(target);
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
 * Creates a signal holding a value computed from the elements matching a selector in the content projected
 * into the element (or in its whole light DOM, with the `lightDom` option), kept up to date while the element is connected.
 *
 * @template Item - The type of the matching elements.
 * @template Value - The type of the queried value.
 * @param element - The component whose projected content is queried.
 * @param selector - The CSS selector the elements must match.
 * @param options - Restricts the query to a single slot, or extends it to the whole light DOM.
 * @param map - Computes the value from the matching elements, in order.
 * @param initialValue - The value held until the element is connected for the first time.
 * @param equals - Tells whether two values are equal, to avoid notifying when the result didn't change.
 * @returns A {@link QuerySignal} instance.
 */
export function createSlotQuerySignal<Item extends Element, Value>(
  element: CustomElement,
  selector: string,
  options: QuerySlotOptions, 
  map: (elements: Item[]) => Value,
  initialValue: Value,
  equals?: (a: Value, b: Value) => boolean
): QuerySignal<Value> {
  return options.lightDom
    ? createQuerySignal(element, () => map(Array.from(element.querySelectorAll<Item>(selector))), initialValue, equals, observeLightDom)
    : createQuerySignal(element, shadowRoot => map(getProjectedElements<Item>(shadowRoot, selector, options.slots)), initialValue, equals, observeProjection);
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
 * @template Item - The type of the matching elements.
 * @param shadowRoot - The Shadow DOM whose slots are inspected.
 * @param selector - The CSS selector the elements must match.
 * @param slots - The name of the only slot to inspect, the empty string for the default slot. When omitted, all the slots are inspected.
 * @returns The matching elements.
 */
function getProjectedElements<Item extends Element>(shadowRoot: ShadowRoot, selector: string, slots?: string | string[]): Item[] {
  const match = typeof slots === 'object' ? (item: HTMLSlotElement) => slots.includes(item.name) : (item: HTMLSlotElement) => item.name === slots;
  let retVal = Array.from(shadowRoot.querySelectorAll('slot'))
  if (slots !== undefined) {
    retVal = retVal.filter(match);
  }

  return retVal.flatMap(item => item.assignedElements({ flatten: true }))
    .filter(assigned => assigned.getRootNode() !== shadowRoot)
    .flatMap(assigned => {
      const retVal = [...assigned.querySelectorAll<Item>(selector)];
      if (assigned.matches(selector)) {
        retVal.unshift(assigned as Item);
      }
      return retVal;
    });
}