import { type Expression, type Identifier, isIdentifier, isPropertyAccessExpression, isPropertyAssignment, type Node } from 'typescript';
import { forEachExpressionChild } from '../expression-children/expression-children.utils';

/**
 * Collects the identifiers of an expression reading a name: the names of the members (`obj.name`, `{ name: 1 }`) and
 * the types of the casts (`format(value as Date)`) don't.
 *
 * @param expression - The expression.
 * @returns The identifiers, in the order they are written.
 */
export function collectReads(expression: Expression): Identifier[] {
  const reads = new Array<Identifier>();
  collectReadsOf(expression, expression, reads);
  return reads;
}

/**
 * Collects the identifiers of a node of an expression, and of the nodes it holds, reading a name (see `collectReads`).
 *
 * @param node - The node.
 * @param parent - The node holding it, the node itself for the root of the expression.
 * @param reads - The identifiers, filled in the order they are written.
 */
function collectReadsOf(node: Node, parent: Node, reads: Identifier[]): void {
  const isMemberName = (isPropertyAccessExpression(parent) || isPropertyAssignment(parent)) && parent.name === node;
  if (isIdentifier(node) && !isMemberName) {
    reads.push(node);
  }

  forEachExpressionChild(node, child => collectReadsOf(child, node, reads));
}
