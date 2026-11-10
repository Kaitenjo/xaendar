import type { RenderChildren } from '../../types/render-children.type';
import type { _Context } from '../context/context.util';

/**
 * The context the children of an element are being rendered in (see {@link renderChildren}), `null` outside of them.
 *
 * N.B. Deliberate, to save memory: the children of an element are rendered in the context of the element, instead of a
 * context of their own, and a node rendered into an element of the template is not tracked, since it is removed along
 * with the element. Rendering is synchronous, so a variable of the module tells {@link trackNode} which nodes those are
 * without a field on every context. Do not go back to a context per element, nor track those nodes: a `@for` moves the
 * nodes its items track (`collectNodes` of `_for`), and would take them out of their element.
 */
let childrenContext: _Context | null = null;

/**
 * Binds a node to the context lifecycle, without inserting it: registers the node with the context, which removes it from
 * `parentNode` when it is cleared, before running its cleanup listeners.
 *
 * Lets a caller register the node before binding what it binds to the node, and insert the node afterwards. A node never
 * inserted, as the element whose bindings threw in the content of a `@try`, or moved into another node, is not removed.
 *
 * Only the nodes at the top of a block are tracked, the ones rendered into the node of the block, so that the nodes a
 * context tracks are all rendered into the same node: a node rendered into an element of the template, by the children
 * of the element (see {@link renderChildren}), is removed along with the element.
 *
 * @param node - The node to track.
 * @param parentNode - The node the node is inserted into: an element, or the shadow root of a component. `null` for a
 *   node the context does not remove, as the nodes of the server a `@hydrate` holds until its content adopts them.
 * @param context - The current template execution scope that owns the node's lifecycle.
 */
export function trackNode(node: Node, parentNode: Node | null, context: _Context): void {
  if (context !== childrenContext) {
    context.addNode(node, parentNode);
  }
}

/**
 * Renders the children of an element in a context, which does not track the nodes rendered into the element (see
 * {@link trackNode}): the context the element is rendered in, or the one created for the children when they get their
 * nodes in another way. The blocks among the children track their nodes in contexts of their own.
 *
 * @param children - Renders the children.
 * @param element - The element.
 * @param context - The context the children are rendered in.
 * @returns The context the children create for themselves, `undefined` when they are rendered in `context`.
 * @throws The error of the render of the children.
 */
export function renderChildren(children: RenderChildren, element: Element, context: _Context): _Context | undefined {
  const previous = childrenContext;
  childrenContext = context;
  try {
    return children(element, context);
  } finally {
    childrenContext = previous;
  }
}
