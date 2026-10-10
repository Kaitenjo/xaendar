import type { _Context } from '../context/context.util';

/**
 * Binds a node to the context lifecycle, without inserting it: registers the node with the context, and schedules
 * a cleanup listener that removes the node from both the context and the DOM when the context is destroyed.
 *
 * Lets a caller register the removal of a node before the cleanup listeners of what it binds to the node,
 * and insert the node afterwards: the cleanup listeners run in registration order.
 *
 * @param node - The node to track.
 * @param parentNode - The parent HTML element the node is inserted into.
 * @param context - The current template execution scope that owns the node's lifecycle.
 */
export function trackNode(node: Node, parentNode: Element, context: _Context): void {
  context.addNode(node);
  context.addUnlistener(() => {
    context.removeNode(node);
    if (node.parentNode === parentNode) {
      parentNode.removeChild(node);
    }
  });
}
