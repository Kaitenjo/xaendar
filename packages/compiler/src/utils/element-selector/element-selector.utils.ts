import type { ElementNode } from '../../parser/types/nodes/element-node.type';

/**
 * Returns the name the component of an element is looked up by: the `is` attribute of a customized built-in element
 * (`copy-button` of `<button is="copy-button">`), the tag name of any other element (`my-card` of `<my-card>`).
 *
 * @param element - The element.
 * @returns The selector of the component the element may be.
 */
export function getElementSelector({ tagName, is }: Pick<ElementNode, 'tagName' | 'is'>): string {
  return is ?? tagName;
}
