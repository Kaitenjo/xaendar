// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { _Context } from '../context/context.util';
import { trackNode } from './track-node.util';

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
