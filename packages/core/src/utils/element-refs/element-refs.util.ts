/**
 * Module-private registry mapping each element a template names with an element ref (`#name`) to the name.
 */
const refs = new WeakMap<Element, string>();

/**
 * Registers the element ref naming an element, so that the queries looking for the ref find it.
 *
 * @param element - The element.
 * @param name - The name of the ref.
 */
export function _setElementRef(element: Element, name: string): void {
  refs.set(element, name);
}

/**
 * Gets the name of the element ref naming an element.
 *
 * @param element - The element.
 * @returns The name of the ref, `undefined` when no ref names the element.
 */
export function _getElementRef(element: Element): string | undefined {
  return refs.get(element);
}
