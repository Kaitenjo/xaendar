import type { _Context } from '../utils/context/context.util';
import type { NodeBlock } from './node-block.type';
import type { RenderElementNamespace } from './render-element-namespace.type';

/**
 * How the code of a template gets the nodes it renders: by creating them, or by adopting the ones the server rendered
 * (hydration). The code of the template and the helpers it calls are the same in both cases, and so are the effects,
 * the listeners and the bindings: the strategy is chosen once per component and once per block, and handed to them.
 */
export type NodeStrategy = {
  /**
   * Gets an element, without inserting it: created, or adopted where the server rendered it.
   *
   * @param context - The context rendering the element.
   * @param parentNode - The node the element is rendered into.
   * @param tagName - The tag name of the element.
   * @param namespace - The namespace an element created is created in, `undefined` for HTML (see `RenderElement`).
   * @returns The element.
   */
  element(context: _Context, parentNode: Node, tagName: string, namespace?: RenderElementNamespace): Element;
  /**
   * Puts an element got by {@link element} in its place, once its bindings are applied: an element created is inserted,
   * which connects a component, while one adopted already is in its place, and a component starts its hydration.
   *
   * @param element - The element.
   * @param parentNode - The node the element is rendered into.
   * @param referenceNode - The node the element is inserted before, `null` to append it.
   */
  mount(element: Element, parentNode: Node, referenceNode: Node | null): void;
  /**
   * Returns the strategy rendering the children of an element got by {@link element}: an element created gets its
   * children created.
   *
   * @param element - The element.
   * @returns The strategy of its children.
   */
  children(element: Element): NodeStrategy;
  /**
   * Gets a text node in its place, tracked by the context: created with the value, or adopted where the server
   * rendered it, keeping its own value.
   *
   * @param context - The context owning the node.
   * @param parentNode - The node the text is rendered into.
   * @param referenceNode - The node the text is inserted before, `null` to append it.
   * @param value - The value of a text created.
   * @param separated - Whether the server wrote `<!---->` before the text (see `getTextSeparators` of the compiler).
   * @returns The text node.
   */
  text(context: _Context, parentNode: Node, referenceNode: Node | null, value: string, separated: boolean): Text;
  /**
   * Passes over the `<!---->` the server wrote before a `@render`, whose content follows it.
   *
   * @param parentNode - The node the content is rendered into.
   * @param separated - Whether the server wrote one.
   */
  separator(parentNode: Node, separated: boolean): void;
  /**
   * Opens a block: creates its anchor, or adopts the markers of the block the server rendered, whose content follows.
   * The anchor is tracked by the context. The last block of its parent has none: its content reaches the end of the
   * parent, where the server writes no marker closing it (see `BlockPosition`).
   *
   * @param context - The context owning the block.
   * @param parentNode - The node the block is rendered into.
   * @param referenceNode - The node the anchor is inserted before, `null` to append it.
   * @param label - The text of an anchor created.
   * @param kind - The marker of the block (see `_SSR_MARKERS`).
   * @param last - Whether the block is the last node of its parent, which needs no anchor.
   * @returns The block.
   */
  block(context: _Context, parentNode: Node, referenceNode: Node | null, label: string, kind: string, last?: boolean): NodeBlock;
  /**
   * Returns the strategy of the first render of a block, given what the browser renders in it: the adopting one when
   * the server rendered the same, after which the content is adopted, the creating one otherwise. A block the server
   * rendered differently is emptied first, with a warning: its content is created again.
   *
   * @param parentNode - The node the block is rendered into.
   * @param block - The block.
   * @param detail - The detail of the marker the server writes for what the browser renders (the index of the branch,
   *   `1` or `0` for an element structural directives are applied to).
   * @returns The strategy rendering the content.
   */
  adopt(parentNode: Node, block: NodeBlock, detail: string): NodeStrategy;
  /**
   * Returns the strategy of the first render of the items of a `@for`, given their keys: the adopting one when the
   * server rendered the same keys in the same order, after which the items are adopted, the creating one otherwise
   * (see {@link adopt}).
   *
   * @param parentNode - The node the block is rendered into.
   * @param block - The block of the `@for`.
   * @param keys - The keys of the items, in order.
   * @returns The strategy rendering the items.
   */
  adoptItems(parentNode: Node, block: NodeBlock, keys: ReadonlyArray<string | number>): NodeStrategy;
  /**
   * Passes over the content of a block the server rendered, leaving its nodes as they are: what follows the block is
   * adopted after its anchor. A `@hydrate` adopts its content later, when a trigger fires.
   *
   * @param parentNode - The node the block is rendered into.
   * @param block - The block.
   * @returns The nodes of the content, `undefined` when it has none.
   */
  skip(parentNode: Node, block: NodeBlock): Node[];
  /**
   * Removes what the server rendered in a block whose content only the browser renders, the `@placeholder` of a
   * `@client`, without warnings: what follows the block is adopted after its anchor.
   *
   * @param parentNode - The node the block is rendered into.
   * @param block - The block.
   * @returns The strategy creating the content.
   */
  replace(parentNode: Node, block: NodeBlock): NodeStrategy;
  /**
   * Closes a block once its first render is done: what follows it is adopted after its anchor. What the server rendered
   * in it and the browser did not adopt is removed, with a warning.
   *
   * @param parentNode - The node the block is rendered into.
   * @param block - The block.
   */
  close(parentNode: Node, block: NodeBlock): void;
  /**
   * Ends the render of the shadow root of a component: what the server rendered in it and the browser did not adopt is
   * removed, with a warning. The children of an element are never removed this way, since a directive or another
   * library may add some to it. The contexts of the render create what they render from then on.
   *
   * @param root - The shadow root.
   * @param context - The context of the render.
   */
  end(root: ShadowRoot, context: _Context): void;
};
