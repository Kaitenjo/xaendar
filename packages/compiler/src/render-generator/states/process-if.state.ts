import { ASTNode } from '../../parser/models/ast.type.js';
import { IfNode } from '../../parser/models/nodes/if-node.type.js';
import { Context } from '../models/render-context.model.js';
import { resolveExpression, indent } from '../utils/render-generator.utils.js';

/**
 * Function type for recursively processing an AST node into render code strings.
 */
type ProcessNodeFn = (node: ASTNode, nodeName: string, parentNode: string, context: Context) => string[];

/**
 * Generates code for an `@if` conditional node.
 * Emits an `if (...) { ... }` block, appending an `else { ... }` block if an alternate exists.
 *
 * @param node The `IfNode` to process.
 * @param nodeName Base variable name prefix for child nodes.
 * @param parentNode Variable name of the parent DOM node.
 * @param context Current render scope context.
 * @param processNode Recursive node processor function.
 * @returns Array of generated code lines.
 */
export function processIf(node: IfNode, nodeName: string, parentNode: string, context: Context, processNode: ProcessNodeFn): string[] {
  const code = [
    `if (${resolveExpression(node.condition)}) {`,
    ...node.consequent.map((child, idx) => indent(...processNode(child, `${nodeName}_t${idx}`, parentNode, context))).flat(),
    '}'
  ];

  const alt = node.alternate;
  if (alt) {
    code[code.length - 1] += ' else {';
    code.push(
      ...alt.children.map((child, idx) => indent(...processNode(child, `${nodeName}_e${idx}`, parentNode, context))).flat(),
      '}'
    );
  }

  return code;
}
