// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { _Context } from '../context/context.util';
import { renderChildren, trackNode } from './track-node.util';

/**
 * A root context creating the elements with the document.
 */
function createContext(): _Context {
  return new _Context({ createElement: (tagName: string) => document.createElement(tagName) } as unknown as _Context);
}

describe('trackNode', () => {
  it('registers the node without inserting it, and removes it once inserted when the context is cleared', () => {
    const parent = document.createElement('div');
    const node = document.createElement('p');
    const context = createContext();

    trackNode(node, parent, context);
    expect(context.getNodes()).toEqual([node]);
    expect(node.parentNode).toBeNull();

    parent.appendChild(node);
    context.clear();
    expect(node.parentNode).toBeNull();
    expect(context.getNodes()).toBeNull();
  });

  it('removes the node before the cleanup listeners registered after it run', () => {
    const parent = document.createElement('div');
    const node = document.createElement('p');
    const context = createContext();
    const cleanup = vi.fn(() => node.parentNode);

    trackNode(node, parent, context);
    context.addUnlistener(cleanup);
    parent.appendChild(node);
    context.clear();

    expect(cleanup).toHaveReturnedWith(null);
  });

  it('removes nothing when the context is cleared before the node is inserted', () => {
    const parent = document.createElement('div');
    const node = document.createElement('p');
    const context = createContext();

    trackNode(node, parent, context);
    context.clear();

    expect(node.parentNode).toBeNull();
    expect(context.getNodes()).toBeNull();
  });

  it('tracks a node the context does not remove, without the node it is inserted into', () => {
    const parent = document.createElement('div');
    const node = parent.appendChild(document.createElement('p'));
    const context = createContext();

    trackNode(node, null, context);
    context.clear();

    expect(context.getNodes()).toBeNull();
    expect(node.parentNode).toBe(parent);
  });

  it('leaves the node where it is when it was moved into another node', () => {
    const parent = document.createElement('div');
    const other = document.createElement('div');
    const node = document.createElement('p');
    const context = createContext();

    trackNode(node, parent, context);
    parent.appendChild(node);
    other.appendChild(node);
    context.clear();

    expect(node.parentNode).toBe(other);
  });
});

describe('renderChildren', () => {
  it('does not track the nodes rendered in the context while it renders the children, and tracks them in another context or afterwards', () => {
    const element = document.createElement('div');
    const context = createContext();
    const block = new _Context(context);
    const child = document.createElement('p');
    const inBlock = document.createElement('p');

    const result = renderChildren((parent, childrenContext) => {
      trackNode(child, parent, childrenContext);
      trackNode(inBlock, parent, block);
      return block;
    }, element, context);
    const after = document.createElement('p');
    trackNode(after, element, context);

    expect(result).toBe(block);
    expect(context.getNodes()).toEqual([after]);
    expect(block.getNodes()).toEqual([inBlock]);
  });

  it('tracks the nodes of the context again when the children throw, and restores the context of an outer render', () => {
    const element = document.createElement('div');
    const outer = createContext();
    const inner = createContext();

    renderChildren(() => {
      expect(() => renderChildren(() => {
        throw new Error('boom');
      }, element, inner)).toThrow('boom');
      trackNode(document.createElement('p'), element, outer);
      trackNode(document.createElement('p'), element, inner);
      return undefined;
    }, element, outer);

    expect(outer.getNodes()).toBeNull();
    expect(inner.getNodes()).toHaveLength(1);
  });
});
