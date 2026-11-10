import type { _Context } from '../context/context.util';

/**
 * Binds a node to the context lifecycle, without inserting it: registers the node with the context, which removes it from
 * `parentNode` when it is cleared, before running its cleanup listeners.
 *
 * Lets a caller register the node before binding what it binds to the node, and insert the node afterwards. A node never
 * inserted, as the element whose bindings threw in the content of a `@try`, or moved into another node, is not removed.
 *
 * @param node - The node to track.
 * @param parentNode - The node the node is inserted into: an element, or the shadow root of a component.
 * @param context - The current template execution scope that owns the node's lifecycle.
 */
export function trackNode(node: Node, parentNode: Node, context: _Context): void {
  context.addNode(node, parentNode);
}
