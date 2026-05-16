import { ASTNode } from '../../parser/models/ast.type.js';
import { ForNode } from '../../parser/models/nodes/for-node.type.js';
import { Context } from '../models/render-context.model.js';
import { resolveForExpression, indent } from '../utils/render-generator.utils.js';

/**
 * Function type for recursively processing an AST node into render code strings.
 */
type ProcessNodeFn = (node: ASTNode, nodeName: string, parentNode: string, context: Context) => string[];

/**
 * Generates code for a `@for` iteration node.
 * Emits a `for (const X of this.Y) { ... }` loop containing the child node code.
 *
 * @param node The `ForNode` to process.
 * @param nodeName Base variable name prefix for child nodes.
 * @param parentNode Variable name of the parent DOM node.
 * @param parentContext The enclosing scope context.
 * @param processNode Recursive node processor function.
 * @returns Array of generated code lines.
 */
export function processFor(node: ForNode, nodeName: string, parentNode: string, parentContext: Context, processNode: ProcessNodeFn): string[] {
  const iterExpr = resolveForExpression(node.expression);
  const context = new Context([iterExpr], parentContext);

  return [
    `for (${iterExpr}) {`,
    ...node.children.map((child, idx) => indent(...processNode(child, `${nodeName}_f${idx}`, parentNode, context))).flat(),
    '}'
  ];
}
