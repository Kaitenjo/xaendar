import { IfNode } from '../../parser/types/nodes/if-node.type.js';
import { Context } from '../models/render-context.model.js';
import { processNode } from '../render-generator.js';
import { indent, resolveExpression } from '../utils/render-generator.utils.js';

/**
 * Generates code for an `@if` conditional node.
 * Emits an `if (...) { ... }` block, appending an `else { ... }` block if an alternate exists.
 *
 * @param node The `IfNode` to process.
 * @param nodeName Base variable name prefix for child nodes.
 * @param parentNode Variable name of the parent DOM node.
 * @param context Current render scope context.
 * @returns Array of generated code lines.
 */
export function processIf(node: IfNode, nodeName: string, parentNode: string, context: Context): string[] {
  const ifContext = new Context([], context);

  const code = [
    `if (${resolveExpression(node.conditionNode, context)}) {`,
    ...node.consequent.map((child, idx) => indent(...processNode(child, `${nodeName}_t${idx}`, parentNode, ifContext))).flat(),
    '}'
  ];

  const alt = node.alternate;
  if (alt) {
    code[code.length - 1] += ' else {';
    const elseContext = new Context([], context);
    code.push(
      ...alt.children.map((child, idx) => indent(...processNode(child, `${nodeName}_e${idx}`, parentNode, elseContext))).flat(),
      '}'
    );
  }

  return code;
}
