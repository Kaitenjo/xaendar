// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { _Context } from '../context/context.util';
import { trackNode } from './track-node.util';

describe('trackNode', () => {
  it('registers the node without inserting it, and removes it once inserted when the context is cleared', () => {
    const parent = document.createElement('div');
    const node = document.createElement('p');
    const context = new _Context({ createElement: (tagName: string) => document.createElement(tagName) } as unknown as _Context);

    trackNode(node, parent, context);
    expect(context.getNodes()).toEqual([node]);
    expect(node.parentNode).toBeNull();

    parent.appendChild(node);
    context.clear();
    expect(node.parentNode).toBeNull();
    expect(context.getNodes()).toEqual([]);
  });
});
