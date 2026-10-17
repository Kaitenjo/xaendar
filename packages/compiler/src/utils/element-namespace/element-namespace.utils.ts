import type { ElementNamespace } from '../../types/element-namespace/element-namespace.type';

/**
 * Returns the namespace an element is created in, exactly like the generated render code creates it: an `<svg>` and a
 * `<math>` element open the SVG and the MathML namespace, any other element is created in the namespace it is declared in.
 *
 * @param tagName - Tag name of the element.
 * @param namespace - The namespace the element is declared in.
 * @returns The namespace of the element.
 */
export function getElementNamespace(tagName: string, namespace: ElementNamespace): ElementNamespace {
  switch (tagName) {
    case 'svg':
      return 'svg';
    case 'math':
      return 'mathml';
    default:
      return namespace;
  }
}

/**
 * Returns the namespace the children of an element are created in: the one of the element, except for the children of
 * a `<foreignObject>`, which embeds HTML in an SVG.
 *
 * @param tagName - Tag name of the element.
 * @param namespace - The namespace of the element (see {@link getElementNamespace}).
 * @returns The namespace of the children of the element.
 */
export function getChildrenNamespace(tagName: string, namespace: ElementNamespace): ElementNamespace {
  switch (tagName) {
    case 'foreignObject':
      return 'html';
    default:
      return namespace;
  }
}
