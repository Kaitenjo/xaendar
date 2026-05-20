import { ASTNodeType } from '../../parser/types/node.enum.js';
import { ElseIfNode } from '../../parser/types/nodes/else-if-node.type.js';
import { ElseNode } from '../../parser/types/nodes/else-node.type.js';
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
    ...processConsequent(node, `${nodeName}_t`, parentNode, ifContext),
    '}'
  ];

  let alt = node.alternate;
  while (alt?.type === ASTNodeType.ElseIf) {
    const elseIfContext = new Context([], context);

    code[code.length - 1] += ` else if (${resolveExpression(alt.conditionNode, context)}) {`
    code.push(
      ...processConsequent(alt, `${nodeName}_e`, parentNode, elseIfContext),
      '}'
    );
    alt = alt.alternate;
  }
  
  if (alt) {
    const elseContext = new Context([], context);
    code[code.length - 1] += ' else {';
    code.push(
      ...processConsequent(alt, `${nodeName}_e`, parentNode, elseContext),
      '}'
    );
  }

  return code;
}

function processConsequent(node: IfNode | ElseIfNode | ElseNode, nodeName: string, parentNode: string, context: Context): string[] {
  return node.consequent.map((child, idx) => indent(...processNode(child, `${nodeName}_c${idx}`, parentNode, context))).flat();
}