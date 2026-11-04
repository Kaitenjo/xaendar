import type { NodeStrategy } from '../../types/node-strategy.type';
import { createAnchor, mountNode } from '../context/context.util';

/**
 * The strategy creating the nodes of a template, as a component rendered in the browser does: every element, text and
 * anchor is created and inserted. It is the one of every component without a declarative shadow root, and of every
 * render of a block after the first one.
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
  block: (context, parentNode, referenceNode, label) => ({ anchor: createAnchor(label, parentNode, context, referenceNode), marker: undefined }),
  adopt: () => CREATE_NODES,
  adoptItems: () => CREATE_NODES,
  skip: () => [],
  replace: () => CREATE_NODES,
  close: () => undefined,
  end: () => undefined
};
