import { forEachChild, isIdentifier, isPropertyAccessExpression, isPropertyAssignment, type Node } from 'typescript';

/**
 * Tells whether an argument of an event handler reads `$event`, whole or in part: `$event`, `$event.target`,
 * `format($event.detail)`, `{ $event }`. A property named `$event` (`item.$event`, `{ $event: 1 }`) is not a read.
 *
 * @param node - The argument, or a node inside it.
 * @returns `true` if the node reads `$event`.
 */
export function readsEvent(node: Node): boolean {
  if (isIdentifier(node)) {
    return node.text === '$event';
  }

  if (isPropertyAccessExpression(node)) {
    return readsEvent(node.expression);
  }

  if (isPropertyAssignment(node)) {
    return readsEvent(node.initializer);
  }

  return forEachChild(node, readsEvent) ?? false;
}
