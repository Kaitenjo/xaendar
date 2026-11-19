import { forEachChild, isAsExpression, type Node } from 'typescript';

/**
 * Visits the children of a node of a template expression as `forEachChild` does, leaving out the type of a cast
 * (`Date` in `format(value as Date)`): it is TypeScript only, and reads nothing.
 *
 * @param node - The node.
 * @param callback - Invoked for each child, until it returns a truthy value.
 * @returns The first truthy value returned by the callback, `undefined` if there is none.
 */
export function forEachExpressionChild<TResult>(node: Node, callback: (child: Node) => TResult | undefined): TResult | undefined {
  return isAsExpression(node) ? callback(node.expression) : forEachChild(node, callback);
}
