import type { NodeBlock } from '../../types/node-block.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import { createAnchor, mountNode } from '../context/context.util';

/**
 * The block created as the last node of its parent: no anchor, its content appended to the parent.
 *
 * N.B. Deliberate, to save memory: one frozen object shared by every last block created, instead of an object per block
 * holding `null`, the runtime only reading it. Do not create one per block.
 */
const LAST_BLOCK: NodeBlock = Object.freeze({ anchor: null, marker: undefined });

/**
 * The strategy creating the nodes of a template, as a component rendered in the browser does: every element, text and
 * anchor is created and inserted, but the anchor of the last block of its parent (see `BlockPosition`). It is the one of
 * every component without a declarative shadow root, and of every render of a block after the first one.
 */
export const CREATE_NODES: NodeStrategy = {
  element: (context, _parentNode, tagName) => context.createElement(tagName),
  mount: (element, parentNode, referenceNode) => {
    parentNode.insertBefore(element, referenceNode);
  },
  children: () => CREATE_NODES,
  text: (context, parentNode, referenceNode, value) => {
    const node = document.createTextNode(value);
    mountNode(node, parentNode, context, referenceNode);
    return node;
  },
  separator: () => undefined,
  block: (context, parentNode, referenceNode, label, _kind, last) => last ? LAST_BLOCK : { anchor: createAnchor(label, parentNode, context, referenceNode), marker: undefined },
  adopt: () => CREATE_NODES,
  adoptItems: () => CREATE_NODES,
  skip: () => [],
  replace: () => CREATE_NODES,
  close: () => undefined,
  end: () => undefined
};
