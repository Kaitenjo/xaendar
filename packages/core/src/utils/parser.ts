import { VirtualNode } from '../models/virtual-node.type';
import { VirtualTree } from '../models/virtual-tree.type';

export class Parser {
  /**
   * Parse a template into a VirtualTree.
   * Useful for comparing renders.
   * @param template template to parse
   * @returns A tree representing the template
   */
  public static fromTemplateToVTree(template: string): VirtualTree {
    const div = document.createElement('div');
    div.innerHTML = template.trim();

    const virtualTree: VirtualTree = [];

    div.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text?.trim()) {
          virtualTree.push(text);
        }
      } else {
        virtualTree.push(Parser.createVirtualNode(node as Element));
      }
    });

    return virtualTree;
  }

  /**
   * Create a VirtualNode from an Element.
   * @param el Element to parse
   * @returns A VirtualNode representing the Element
   */
  private static createVirtualNode(el: Element): VirtualNode {
    return {
      tag: el.tagName.toLowerCase(),
      props: Object.fromEntries(Array.from(el.attributes).map(a => [a.name, a.value])),
      children: Array.from(el.childNodes).map(node => node.nodeType === Node.TEXT_NODE ? node.textContent ?? '' : Parser.createVirtualNode(node as Element))
    };
  }
}
