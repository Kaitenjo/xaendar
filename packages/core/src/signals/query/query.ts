import type { CustomElement } from '../../models/custom-element/custom-element';
import { getSelector } from '../../utils/get-selector/get-selector.util';
import type { QuerySignal } from '../types/query-signal.type';
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
 * Creates a signal holding the result of `read`, kept up to date by observing
 * the Shadow DOM of the element: it is recomputed each time its tree changes.
 * The observer is disconnected when the element is disconnected.
 *
 * @template Value - The type of the queried value.
 * @param element - The component whose Shadow DOM is observed.
 * @param read - Reads the current value from the Shadow DOM.
 * @param initialValue - The value held until the first change of the Shadow DOM.
 * @param equals - Tells whether two values are equal, to avoid notifying when the result didn't change.
 * @returns A {@link QuerySignal} instance.
 */
export function createQuerySignal<Value>(element: CustomElement, read: (shadowRoot: ShadowRoot) => Value, initialValue: Value, equals?: (a: Value, b: Value) => boolean): QuerySignal<Value> {
  const signal = new Signal.State<Value>(initialValue, { equals });
  const shadowRoot = element.shadowRoot!;
  const getter = function () { return signal.get(); }

  const mutationObserver = new MutationObserver(() => signal.set(read(shadowRoot)));
  mutationObserver.observe(shadowRoot, { childList: true, subtree: true });
  element['_unlistenFns'].push(() => mutationObserver.disconnect());

  return Object.assign(getter, {
    get: signal.get.bind(signal)
  });
}
