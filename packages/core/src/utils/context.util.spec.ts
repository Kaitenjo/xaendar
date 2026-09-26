// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { BaseWebComponent } from '../directives/base-web-component';
import { _Context, createAnchor, mountNode } from './context.util';

function createRoot(root: Record<string, unknown> = {}): _Context {
  const parent = {
    createElement: (tagName: string) => document.createElement(tagName),
    get: () => undefined
  } as unknown as _Context;
  return new _Context(root as unknown as BaseWebComponent, parent);
}

describe('_Context', () => {
  describe('createElement', () => {
    it('is inherited from the parent context', () => {
      const root = createRoot();
      expect(root.createElement('div').tagName).toBe('DIV');
      expect(root.addChild().createElement).toBe(root.createElement);
    });
  });

  describe('identifiers', () => {
    it('stores and returns an identifier', () => {
      const context = createRoot();
      context.addIdentifier('name', 1);
      expect(context.get('name')).toBe(1);
    });

    it('throws when the identifier is already declared', () => {
      const context = createRoot();
      context.addIdentifier('name', 1);
      expect(() => context.addIdentifier('name', 2)).toThrow('Identifier "name" is already declared in this scope.');
    });

    it('removes an identifier', () => {
      const context = createRoot();
      context.addIdentifier('name', 1);
      context.removeIdentifier('name');
      expect(context.get('name')).toBeUndefined();
    });

    it('resolves identifiers from ancestor scopes', () => {
      const root = createRoot();
      root.addIdentifier('outer', 'value');
      expect(root.addChild().get('outer')).toBe('value');
    });

    it('prefers the identifier of the own scope, even when falsy', () => {
      const root = createRoot();
      root.addIdentifier('name', 'outer');
      const child = root.addChild();
      child.addIdentifier('name', 0);
      expect(child.get('name')).toBe(0);
    });

    it('returns undefined for unknown identifiers', () => {
      expect(createRoot().addChild().get('unknown')).toBeUndefined();
    });
  });

  describe('getEventHandler', () => {
    it('returns the root method bound to the root', () => {
      const root = { value: 42, handler(this: { value: number }) { return this.value; } };
      const handler = createRoot(root).getEventHandler('handler');
      expect(handler()).toBe(42);
    });
  });

  describe('children', () => {
    it('creates a child context when none is provided', () => {
      const root = createRoot();
      const child = root.addChild();
      expect(child).toBeInstanceOf(_Context);
      expect(child).not.toBe(root);
    });

    it('registers a provided child context', () => {
      const root = createRoot();
      const provided = createRoot();
      expect(root.addChild(provided)).toBe(provided);
    });

    it('removes a child from the beginning, the middle and the end', () => {
      const root = createRoot();
      const [a, b, c, d] = [root.addChild(), root.addChild(), root.addChild(), root.addChild()];
      const spies = [a, b, c, d].map(child => vi.spyOn(child, 'unlisten'));

      root.removeChild(a);
      root.removeChild(c);
      root.removeChild(d);
      root.unlisten();

      expect(spies.map(spy => spy.mock.calls.length)).toEqual([0, 1, 0, 0]);
    });
  });

  describe('removeChild', () => {
    it('ignores a context that is not a child', () => {
      const root = createRoot();
      const child = root.addChild();
      const childUnlisten = vi.spyOn(child, 'unlisten');

      root.removeChild(createRoot());
      root.unlisten();

      expect(childUnlisten).toHaveBeenCalledOnce();
    });
  });

  describe('nodes', () => {
    it('tracks and untracks nodes', () => {
      const context = createRoot();
      const a = document.createElement('a');
      const b = document.createElement('b');

      context.addNode(a);
      context.addNode(b);
      expect(context.getNodes()).toEqual([a, b]);

      context.removeNode(a);
      expect(context.getNodes()).toEqual([b]);
    });
  });

  describe('unlisten', () => {
    it('runs the registered cleanups, destroys the children and clears the state', () => {
      const root = createRoot();
      const child = root.addChild();
      const childUnlisten = vi.spyOn(child, 'unlisten');
      const first = vi.fn();
      const second = vi.fn();
      root.listen(first, second);
      root.addIdentifier('name', 1);
      root.addNode(document.createElement('div'));

      root.unlisten();

      expect(first).toHaveBeenCalledOnce();
      expect(second).toHaveBeenCalledOnce();
      expect(childUnlisten).toHaveBeenCalledOnce();
      expect(root.getNodes()).toEqual([]);
      expect(root.get('name')).toBeUndefined();

      root.unlisten();
      expect(first).toHaveBeenCalledOnce();
      expect(childUnlisten).toHaveBeenCalledOnce();
    });
  });
});

describe('mountNode', () => {
  it('appends the node when no reference node is provided', () => {
    const parent = document.createElement('div');
    parent.appendChild(document.createElement('span'));
    const node = document.createElement('p');

    mountNode(node, parent, createRoot());

    expect(parent.lastChild).toBe(node);
  });

  it('inserts the node before the reference node', () => {
    const parent = document.createElement('div');
    const reference = document.createComment('ref');
    parent.appendChild(reference);
    const node = document.createElement('p');

    mountNode(node, parent, createRoot(), reference);

    expect(node.nextSibling).toBe(reference);
  });

  it('tracks the node in the context', () => {
    const context = createRoot();
    const node = document.createElement('p');
    mountNode(node, document.createElement('div'), context);
    expect(context.getNodes()).toEqual([node]);
  });

  it('removes the node from the DOM and the context when the context is destroyed', () => {
    const parent = document.createElement('div');
    const context = createRoot();
    const node = document.createElement('p');
    mountNode(node, parent, context);

    context.unlisten();

    expect(node.parentNode).toBeNull();
    expect(context.getNodes()).toEqual([]);
  });

  it('does not touch a node that has been moved elsewhere', () => {
    const parent = document.createElement('div');
    const other = document.createElement('div');
    const context = createRoot();
    const node = document.createElement('p');
    mountNode(node, parent, context);
    other.appendChild(node);

    context.unlisten();

    expect(node.parentNode).toBe(other);
  });
});

describe('createAnchor', () => {
  it('mounts a labelled comment', () => {
    const parent = document.createElement('div');
    const context = createRoot();

    const anchor = createAnchor('label', parent, context);

    expect(anchor).toBeInstanceOf(Comment);
    expect(anchor.textContent).toBe('label');
    expect(anchor.parentNode).toBe(parent);
    expect(context.getNodes()).toEqual([anchor]);
  });

  it('honours the reference node', () => {
    const parent = document.createElement('div');
    const reference = document.createComment('ref');
    parent.appendChild(reference);

    const anchor = createAnchor('label', parent, createRoot(), reference);

    expect(anchor.nextSibling).toBe(reference);
  });
});
