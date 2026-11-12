import { _SSR_MARKERS } from '../../costants';
import type { Block } from '../../types/if/block.type';
import type { _Context } from '../../types/context.type';
import { addChild, getNodeStrategy } from '../context/context.util';

/**
 * Renders a `@client` block, whose content only the browser renders.
 *
 * In a page rendered on the server, the content is created while the component holding it hydrates, in place of the
 * `@placeholder` the server rendered, if any, so that `afterRender` and the queries find it: the placeholder of a block
 * the hydration waits for stays until a trigger fires. In a page rendered in the browser, the block is as if it were not
 * there.
 *
 * @param parentNode - The parent HTML element the block is rendered into.
 * @param parentContext - The context owning the block.
 * @param referenceNode - The node to insert the block before, `null` to append it.
 * @param content - Renders the content.
 * @param last - Whether the block is the last node of its parent, which needs no anchor (see `BlockPosition`).
 * @param slot - The slot of the anchor in the context, given by the compiler to a block at the top of the block of a scope
 *   with an anchor: omitted for the others, whose anchor no scope tracks.
 */
export function _client(parentNode: HTMLElement, parentContext: _Context, referenceNode: Comment | null, content: Block['block'], last = false, slot?: number): void {
  const nodeStrategy = getNodeStrategy(parentContext);
  const nodeBlock = nodeStrategy.block(parentContext, parentNode, referenceNode, 'client', _SSR_MARKERS.client, last, slot);
  addChild(parentContext, content(parentNode, parentContext, nodeBlock.anchor, nodeStrategy.replace(parentNode, nodeBlock)));
}
