import { MATHML_NS, SVG_NS } from '../../costants';
import type { RenderElementNamespace } from '../../types/render-element-namespace.type';
import { isInTryScope } from '../try-scope/try-scope.util';

/**
 * Creates an element of a template in its namespace, as the compiler writes it in the constant of the element (see
 * `RenderElement`): an HTML element, the one without namespace, through {@link _createElement}, so that a component
 * defined is constructed by its class in the content of a `@try`.
 *
 * N.B. Deliberate, to save memory: the namespace comes from the constant of the element, shared by every instance and
 * left out for an HTML element, instead of a factory held by every context and changed by the code of the children of
 * an `<svg>`, a `<math>` or a `<foreignObject>`, which would need a context of their own for it. Do not go back to a
 * factory per context.
 *
 * @param tagName - The tag name of the element.
 * @param namespace - The namespace of the element, `undefined` for HTML.
 * @returns The element.
 * @throws The error of the constructor of a custom element, in the content of a `@try`.
 */
export function createNamespacedElement(tagName: string, namespace: RenderElementNamespace | undefined): Element {
  switch (namespace) {
    case 1:
      return _createSVGElement(tagName);

    case 2:
      return _createMATHMLElement(tagName);

    default:
      return _createElement(tagName);
  }
}

/**
 * Creates an HTML element with the specified tag name. In the content of a `@try`, the element of a custom element
 * already defined is constructed by its class, so that the error of the constructor is thrown here, as the template
 * calls it: `document.createElement` reports it and creates an element that is not the component.
 *
 * @param tagName - The HTML tag name of the element to create.
 * @returns The newly created HTML element.
 * @throws The error of the constructor of the custom element, in the content of a `@try`.
 */
export function _createElement(tagName: string): HTMLElement {
  const Component = isInTryScope() ? customElements.get(tagName) : undefined;
  return Component ? new Component() : document.createElement(tagName);
}

/**
 * Creates an SVG element with the specified tag name using the SVG namespace.
 *
 * @param tagName - The SVG tag name of the element to create.
 * @returns The newly created SVG element.
 */
export function _createSVGElement(tagName: string): SVGElement {
  return document.createElementNS(SVG_NS, tagName);
}

/**
 * Creates a MathML element with the specified tag name using the MathML namespace.
 *
 * @param tagName - The MathML tag name of the element to create.
 * @returns The newly created MathML element.
 */
export function _createMATHMLElement(tagName: string): MathMLElement {
  return document.createElementNS(MATHML_NS, tagName);
}
