import type { ElementNamespace } from '../../../types/element-namespace/element-namespace.type';
import type { ElementEventMap } from '../../types/element-event-map.type';

/**
 * Returns the global DOM interface mapping the names of the native events of the elements of a namespace to their type.
 *
 * @param namespace - The namespace of the elements.
 * @returns The event map, `HTMLElementEventMap` for the HTML namespace.
 */
export function getEventMap(namespace: ElementNamespace): ElementEventMap {
  switch (namespace) {
    case 'svg':
      return 'SVGElementEventMap';
    case 'mathml':
      return 'MathMLElementEventMap';
    default:
      return 'HTMLElementEventMap';
  }
}

/**
 * Returns the type of a native element, as the DOM declares it for its tag name in the map of its namespace, e.g.
 * `HTMLInputElement` for an `<input>` or `SVGCircleElement` for a `<circle>`. The type is inferred instead of indexed, so
 * that a tag name the map doesn't declare (an unknown element, a custom element of another library not declaring
 * itself in the map) gets the type every element of the namespace has.
 *
 * @example
 * getElementType('html', 'input');  // "(HTMLElementTagNameMap extends { 'input': infer Type } ? Type : HTMLElement)"
 *
 * @param namespace - The namespace of the element.
 * @param tagName - The tag name of the element.
 * @returns The type of the element.
 */
export function getElementType(namespace: ElementNamespace, tagName: string): string {
  const [tagNameMap, element] = getTagNameMap(namespace);
  return `(${tagNameMap} extends { '${tagName}': infer Type } ? Type : ${element})`;
}

/**
 * Returns the global DOM interface mapping the tag names of the elements of a namespace to their type, and the
 * interface every element of the namespace implements.
 *
 * @param namespace - The namespace of the elements.
 * @returns The tag name map and the element interface of the namespace.
 */
function getTagNameMap(namespace: ElementNamespace): [tagNameMap: string, element: string] {
  switch (namespace) {
    case 'svg':
      return ['SVGElementTagNameMap', 'SVGElement'];
    case 'mathml':
      return ['MathMLElementTagNameMap', 'MathMLElement'];
    default:
      return ['HTMLElementTagNameMap', 'HTMLElement'];
  }
}
