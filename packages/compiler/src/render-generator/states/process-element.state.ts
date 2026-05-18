import { ElementNode } from '../../parser/models/nodes/element-node.type.js';
import { Context } from '../models/render-context.model.js';
import { processNode } from '../render-generator.js';

/**
 * Generates code for an HTML element node: creates the DOM element, sets attributes,
 * attaches event listeners, appends it to the parent, and recursively processes children.
 *
 * @param node The `ElementNode` to process.
 * @param nodeName Variable name to use for the created DOM element.
 * @param parentNode Variable name of the parent DOM node to append to.
 * @param context Current render scope context.
 * @returns Array of generated code lines.
 */
export function processElement(node: ElementNode, nodeName: string, parentNode: string, context: Context): string[] {
  const childrenContext = new Context([], context);

  return [
    `const ${nodeName} = document.createElement("${node.tagName}");`,
    ...(node.attributes?.map(attr => `${nodeName}.setAttribute('${attr.name}', ${typeof attr.value === "string" ? attr.value : `this.${attr.value.expression}`});`) || []),
    ...(node.events?.map(event => `${nodeName}.addEventListener("${event.name}", this.${event.handler}.bind(this));`) || []),
    `${parentNode}.appendChild(${nodeName});`,
    ...(node.children.map((child, i) => processNode(child, `${nodeName}_c${i}`, nodeName, childrenContext)).flat())
  ];
}
