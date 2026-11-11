import type { NoArgsVoidFunction } from '@xaendar/types';
import { _HYDRATE_ATTRIBUTE, _SSR_MARKERS, HYDRATE } from '../../costants';
import type { NodeBlock } from '../../types/node-block.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { _Context } from '../context/context.util';
import type { RenderElementNamespace } from '../../types/render-element-namespace.type';
import { createNamespacedElement } from '../create-element/create-element.util';
import { CREATE_NODES } from '../create-nodes/create-nodes.util';
import { deferElementHydration, waitedForTrigger } from '../hydration-triggers/hydration-triggers.util';
import { _encodeTrackKey } from '../track-key/track-key.util';
import { trackNode } from '../track-node/track-node.util';

/**
 * The elements of components adopted by the component rendering them, which they wait for before hydrating (see
 * `CustomElement`).
 */
const claimedElements = new WeakSet<Element>();

/**
 * The elements of components adopted by a hydration that waited for a trigger, which hydrate without warnings too (see
 * `ClaimNodes`).
 */
const quietElements = new WeakSet<Element>();

/**
 * The strategy adopting the nodes the server rendered into the declarative shadow root of a component, instead of
 * creating them: the hydration of the component. It walks the children of each node in order, as the code of the
 * template renders them, and removes the markers it passes over, but the ones closing a block, which become its anchor,
 * so that the nodes are the ones a component rendered in the browser has.
 *
 * Where the HTML does not match the template, as when the parser moved a node, or the server rendered a branch the
 * browser does not, the part that differs is created, with a warning, and what the server rendered there is removed:
 * the rest stays adopted. It is used only by the first render of a component and of its blocks: what they render
 * afterwards is created. The content of a `@hydrate` is passed over, and adopted later by a strategy of its own, while
 * the `@placeholder` of a `@client` is removed, the content of the block created in its place.
 *
 * A hydration that waited for a trigger, the one of a `@hydrate` or the one a `@WebComponent` declares, renders the
 * state of the page when the trigger fires, which may have changed meanwhile: what differs is rendered again without a
 * warning, there and in the components it adopts.
 */
export class ClaimNodes implements NodeStrategy {
  /**
   * The elements created in place of a node not matching them, whose content is created too.
   */
  private readonly _created = new WeakSet<Element>();
  /**
   * The next node to adopt among the children of each node, `null` once every child is adopted.
   */
  private readonly _positions = new Map<Node, Node | null>();

  /**
   * Creates the strategy adopting the content of the shadow root of a component, or the one of a `@hydrate`.
   *
   * @param _host - The tag name of the component, named by the warnings.
   * @param _withinBlock - Whether it adopts the content of a `@hydrate`, whose trigger is the one of the components it
   *   holds: they hydrate as soon as they are adopted, whatever their `@WebComponent` declares.
   * @param _quiet - Whether the hydration waited for a trigger: what differs from the HTML of the server is rendered
   *   again without a warning, in the components it adopts too.
   */
  constructor(
    private readonly _host: string, 
    private readonly _withinBlock = false, 
    private readonly _quiet = _withinBlock
  ) { }

  /**
   * Adopts the element at the position, or creates it when the node there is not one with the same tag name.
   *
   * @param _context - Unused: the element is adopted, or created in its namespace.
   * @param parentNode - The node the element is rendered into.
   * @param tagName - The tag name of the element.
   * @param namespace - The namespace an element created is created in, `undefined` for HTML.
   * @returns The element.
   * @throws The error of the constructor of a custom element created, in the content of a `@try`.
   */
  public element(_context: _Context, parentNode: Node, tagName: string, namespace?: RenderElementNamespace): Element {
    const node = this._next(parentNode);
    if (node?.nodeType === Node.ELEMENT_NODE && (node as Element).localName === tagName) {
      this._positions.set(parentNode, node.nextSibling);
      return node as Element;
    }

    this._warn(`${describe(node)} where the browser renders <${tagName}>, which it creates`);
    const element = createNamespacedElement(tagName, namespace);
    this._created.add(element);
    return element;
  }

  /**
   * Inserts an element created in place of a node not matching it, at the position. An element adopted is already in
   * place: the component it is starts its hydration, its inputs set (see `CustomElement`), or waits for the trigger its
   * `@WebComponent` declares, unless it is in the content of a `@hydrate`.
   *
   * @param element - The element.
   * @param parentNode - The node the element is rendered into.
   */
  public mount(element: Element, parentNode: Node): void {
    if (this._created.has(element)) {
      parentNode.insertBefore(element, this._next(parentNode));
      return;
    }

    claimedElements.add(element);
    if (this._quiet) {
      quietElements.add(element);
    }

    // A `@hydrate` holding the element decides for it: the template wins over what the class declares for every instance
    if (this._withinBlock) {
      element.removeAttribute(_HYDRATE_ATTRIBUTE);
      startHydration(element);
    } else if (!deferElementHydration(element, () => startHydration(element))) {
      startHydration(element);
    }
  }

  /**
   * Returns the strategy of the children of an element: this one for an element adopted, the creating one for an
   * element created.
   *
   * @param element - The element.
   * @returns The strategy of its children.
   */
  public children(element: Element): NodeStrategy {
    return this._created.has(element) ? CREATE_NODES : this;
  }

  /**
   * Adopts the text at the position, after the separator before it, or creates it when the node there is not a text: an
   * empty interpolation has no text node.
   *
   * @param context - The context owning the node.
   * @param parentNode - The node the text is rendered into.
   * @param _referenceNode - Unused: the text is created at the position.
   * @param value - The value of a text created.
   * @param separated - Whether the server wrote `<!---->` before the text.
   * @returns The text node.
   */
  public text(context: _Context, parentNode: Node, _referenceNode: Node | null, value: string, separated: boolean): Text {
    this.separator(parentNode, separated);
    let node = this._next(parentNode);
    if (node?.nodeType === Node.TEXT_NODE) {
      this._positions.set(parentNode, node.nextSibling);
    } else {
      node = document.createTextNode(value);
      parentNode.insertBefore(node, this._next(parentNode));
    }

    trackNode(node, parentNode, context);
    return node as Text;
  }

  /**
   * Removes the `<!---->` at the position, when the server wrote one.
   *
   * @param parentNode - The node the content is rendered into.
   * @param separated - Whether the server wrote one.
   */
  public separator(parentNode: Node, separated: boolean): void {
    const node = this._next(parentNode);
    if (separated && isMarker(node, _SSR_MARKERS.text)) {
      this._remove(parentNode, node!);
    }
  }

  /**
   * Adopts the block at the position: removes the marker opening it, and takes the one closing it as its anchor. The last
   * block of its parent has no marker closing it: its content reaches the end of the parent, and it keeps no anchor.
   * When the node there does not open a block of this kind, the block is created, with a warning, what the server
   * rendered from the position on removed for the last block of its parent, which all of it belongs to.
   *
   * @param context - The context owning the block.
   * @param parentNode - The node the block is rendered into.
   * @param _referenceNode - Unused: the block is adopted, or created, at the position.
   * @param label - The text of an anchor created.
   * @param kind - The marker of the block.
   * @param last - Whether the block is the last node of its parent, which needs no anchor.
   * @returns The block.
   */
  public block(context: _Context, parentNode: Node, _referenceNode: Node | null, label: string, kind: string, last = false): NodeBlock {
    const open = this._next(parentNode);
    const opens = isMarker(open, kind) || isMarker(open, `${kind}:`, true);
    const close = opens && !last ? findClose(open!, kind) : null;
    if (opens && (last || close)) {
      const marker = (open as Comment).data.slice(kind.length + 1);
      this._remove(parentNode, open!);
      if (close) {
        trackNode(close, parentNode, context);
      }

      return { anchor: close, marker, kind };
    }

    this._warn(`${describe(open)} where the browser renders <!--${kind}-->, which it creates`);
    if (last) {
      this._empty(parentNode, null);
      return CREATE_NODES.block(context, parentNode, null, label, kind, true);
    }

    const anchor = document.createComment(label);
    trackNode(anchor, parentNode, context);
    parentNode.insertBefore(anchor, open);
    return { anchor, marker: undefined };
  }

  /**
   * Returns this strategy when the server rendered in the block what the browser renders, the creating one otherwise,
   * after emptying the block with a warning. A block created in place of a missing one is created.
   *
   * @param parentNode - The node the block is rendered into.
   * @param block - The block.
   * @param detail - The detail of the marker the server writes for what the browser renders.
   * @returns The strategy rendering the content.
   */
  public adopt(parentNode: Node, block: NodeBlock, detail: string): NodeStrategy {
    if (block.marker === detail) {
      return this;
    }

    if (block.marker !== undefined) {
      this._warn(`${blockName(block, block.marker)} where the browser renders ${blockName(block, detail)}, which it renders again`);
      this._empty(parentNode, block.anchor);
    }

    return CREATE_NODES;
  }

  /**
   * Returns this strategy when the server rendered the items of the `@for` with the same keys, in the same order,
   * removing the markers of the items, the creating one otherwise (see {@link adopt}).
   *
   * @param parentNode - The node the block is rendered into.
   * @param block - The block of the `@for`.
   * @param keys - The keys of the items, in order.
   * @returns The strategy rendering the items.
   */
  public adoptItems(parentNode: Node, block: NodeBlock, keys: ReadonlyArray<string | number>): NodeStrategy {
    if (block.marker === undefined) {
      return CREATE_NODES;
    }

    const markers = findItemMarkers(this._next(parentNode), block.anchor);
    let matches = markers.length === keys.length;
    for (let i = 0; matches && i < keys.length; i++) {
      matches = markers[i].data === `${_SSR_MARKERS.item}:${_encodeTrackKey(keys[i])}`;
    }

    if (!matches) {
      this._warn(`other items in a <!--${_SSR_MARKERS.for}--> than the browser renders, which it renders again`);
      this._empty(parentNode, block.anchor);
      return CREATE_NODES;
    }

    for (let i = 0; i < markers.length; i++) {
      this._next(parentNode) === markers[i]
        ? this._remove(parentNode, markers[i])
        : parentNode.removeChild(markers[i]);
    }

    return this;
  }

  /**
   * Passes over the content of a block the server rendered, moving the position after its anchor.
   *
   * @param parentNode - The node the block is rendered into.
   * @param block - The block.
   * @returns The nodes of the content, `undefined` when it has none.
   */
  public skip(parentNode: Node, block: NodeBlock): Node[] {
    const nodes = new Array<Node>;
    for (let node = this._next(parentNode); node && node !== block.anchor; node = node.nextSibling) {
      nodes.push(node);
    }

    this._positions.set(parentNode, block.anchor?.nextSibling ?? null);
    return nodes;
  }

  /**
   * Removes what the server rendered in a block whose content only the browser renders, moving the position after its
   * anchor. A block created in place of a missing one has nothing to remove.
   *
   * @param parentNode - The node the block is rendered into.
   * @param block - The block.
   * @returns The strategy creating the content.
   */
  public replace(parentNode: Node, block: NodeBlock): NodeStrategy {
    if (block.marker !== undefined) {
      this._empty(parentNode, block.anchor);
      this._positions.set(parentNode, block.anchor?.nextSibling ?? null);
    }

    return CREATE_NODES;
  }

  /**
   * Sets the node to adopt next among the children of a node: the first node of the content of a `@hydrate` adopted once
   * a trigger fires.
   *
   * @param parentNode - The node.
   * @param node - The node to adopt next, `null` when the content has no node and closes its parent.
   */
  public startAt(parentNode: Node, node: Node | null): void {
    this._positions.set(parentNode, node);
  }

  /**
   * Moves the position after the anchor of a block adopted, removing what the server rendered in it and the browser
   * did not adopt, with a warning.
   *
   * @param parentNode - The node the block is rendered into.
   * @param block - The block.
   */
  public close(parentNode: Node, block: NodeBlock): void {
    if (block.marker !== undefined) {
      this._removeRest(parentNode, block.anchor);
      this._positions.set(parentNode, block.anchor?.nextSibling ?? null);
    }
  }

  /**
   * Removes what the server rendered in the shadow root of the component after the nodes adopted, with a warning, and
   * forgets the positions: the hydration is over, and the contexts of the render create what they render from now on.
   *
   * @param root - The shadow root.
   * @param context - The context of the render.
   */
  public end(root: ShadowRoot, context: _Context): void {
    this._removeRest(root, null);
    this._positions.clear();
    context.setNodeStrategy(CREATE_NODES);
  }

  /**
   * Returns the node to adopt next among the children of a node. The first child is remembered as the position the first
   * time, so that a node created before it does not take its place.
   *
   * @param parentNode - The node.
   * @returns The node, `null` when every child is adopted.
   */
  private _next(parentNode: Node): Node | null {
    return this._positions.getOrInsert(parentNode, parentNode.firstChild);
  }

  /**
   * Removes a node at the position, moving the position to the node following it.
   *
   * @param parentNode - The node it is a child of.
   * @param node - The node.
   */
  private _remove(parentNode: Node, node: Node): void {
    this._positions.set(parentNode, node.nextSibling);
    parentNode.removeChild(node);
  }

  /**
   * Removes the nodes from the position up to a node, the position moving to it.
   *
   * @param parentNode - The node they are children of.
   * @param until - The node to stop at, `null` to remove every node.
   */
  private _empty(parentNode: Node, until: Node | null): void {
    for (let node = this._next(parentNode); node && node !== until; node = this._next(parentNode)) {
      this._remove(parentNode, node);
    }
  }

  /**
   * Removes the nodes left from the position up to a node, with a warning when there are any.
   *
   * @param parentNode - The node they are children of.
   * @param until - The node to stop at, `null` to remove every node.
   */
  private _removeRest(parentNode: Node, until: Node | null): void {
    const node = this._next(parentNode);
    if (node && node !== until) {
      this._warn(`${describe(node)} the browser does not render, which it removes along with what follows it`);
      this._empty(parentNode, until);
    }
  }

  /**
   * Warns that the HTML rendered on the server does not match the template, unless the hydration waited for a trigger.
   *
   * @param detail - What differs.
   */
  private _warn(detail: string): void {
    if (!this._quiet) {
      console.warn(`Xaendar: the server rendered in <${this._host}> ${detail}`);
    }
  }
}

/**
 * Creates the strategy hydrating a component, adopting the content of its declarative shadow root. The `<style>` the
 * server wrote first, when the component has a stylesheet, is removed: the browser adopts the stylesheet instead. A
 * component that waited for a trigger, or adopted by a hydration that did, hydrates without warnings.
 *
 * @param root - The shadow root of the component.
 * @param styled - Whether the component has a stylesheet.
 * @returns The strategy.
 */
export function claimShadowRoot(root: ShadowRoot, styled: boolean): ClaimNodes {
  const style = root.firstChild;
  if (styled && style?.nodeType === Node.ELEMENT_NODE && (style as Element).localName === 'style') {
    root.removeChild(style);
  }

  const { host } = root;
  return new ClaimNodes(host.localName, false, quietElements.has(host) || waitedForTrigger(host));
}

/**
 * Tells whether the element of a component was adopted by the component rendering it, which sets its inputs before.
 *
 * @param element - The element.
 * @returns `true` once it is adopted.
 */
export function isClaimed(element: Element): boolean {
  return claimedElements.has(element);
}

/**
 * Tells whether a node is a marker of the server.
 *
 * @param node - The node.
 * @param data - The text of the marker, or its start.
 * @param prefix - Whether `data` is the start of the text.
 * @returns `true` when the node is a comment holding the text.
 */
function isMarker(node: Node | null, data: string, prefix = false): node is Comment {
  if (!isComment(node)) {
    return false;
  }

  const text = node.data;
  return prefix ? text.startsWith(data) : text === data;
}

/**
 * Tells whether a node is a comment.
 *
 * @param node - The node.
 * @returns `true` when the node is a comment.
 */
function isComment(node: Node | null): node is Comment {
  return node?.nodeType === Node.COMMENT_NODE;
}

/**
 * Finds the marker closing a block among the nodes following the one opening it, skipping the blocks of the same kind
 * it holds.
 *
 * @param open - The marker opening the block.
 * @param kind - The marker of the block.
 * @returns The marker closing it, `null` when there is none.
 */
function findClose(open: Node, kind: string): Comment | null {
  let depth = 0;
  for (let node = open.nextSibling; node; node = node.nextSibling) {
    if (isMarker(node, `/${kind}`)) {
      if (!depth) {
        return node;
      }

      depth--;
    } else if (isMarker(node, kind) || isMarker(node, `${kind}:`, true)) {
      depth++;
    }
  }

  return null;
}

/**
 * Finds the markers of the items of a `@for` between its first node and its anchor, skipping the ones of the `@for`s it
 * holds.
 *
 * @param first - The first node of the `@for`, `null` when the last node of its parent renders no item.
 * @param anchor - Its anchor, `null` when it is the last node of its parent.
 * @returns The markers of its items, in order.
 */
function findItemMarkers(first: Node | null, anchor: Node | null): Comment[] {
  const markers = new Array<Comment>();
  let depth = 0;
  for (let node: Node | null = first; node !== anchor; node = node!.nextSibling) {
    if (isMarker(node, _SSR_MARKERS.for)) {
      depth++;
    } else if (isMarker(node, `/${_SSR_MARKERS.for}`)) {
      depth--;
    } else if (!depth && isMarker(node, `${_SSR_MARKERS.item}:`, true)) {
      markers.push(node);
    }
  }

  return markers;
}

/**
 * Describes a block by its marker, as the warnings name it.
 *
 * @param block - The block, adopted.
 * @param detail - The detail of the marker.
 * @returns The marker, as the server writes it.
 */
function blockName(block: NodeBlock, detail: string): string {
  const { kind } = block;
  return detail ? `<!--${kind}:${detail}-->` : `<!--${kind}-->`;
}

/**
 * Describes a node, as the warnings name it.
 *
 * @param node - The node, `null` for none.
 * @returns Its description.
 */
function describe(node: Node | null): string {
  switch (node?.nodeType) {
    case undefined:
      return 'nothing';

    case Node.ELEMENT_NODE:
      return `<${(node as Element).localName}>`;

    case Node.COMMENT_NODE:
      return `<!--${(node as Comment).data}-->`;

    default:
      return `the text "${node!.textContent}"`;
  }
}

/**
 * Starts the hydration of an element adopted: an element whose class is not defined yet starts it once the class is
 * defined.
 *
 * @param element - The element.
 */
function startHydration(element: Element): void {
  (element as Partial<Record<typeof HYDRATE, NoArgsVoidFunction>>)[HYDRATE]?.();
}
