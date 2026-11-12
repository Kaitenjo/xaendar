// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { BlockConfig } from '../../types/if/block-config.type';
import { HEADER } from '../../costants';
import type { _Context } from '../../types/context.type';
import type { _ScopeLayout } from '../../types/scope-layout.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _scope, STRUCTURAL_LAYOUT, clear, ELEMENT_LAYOUT, EMPTY_LAYOUT, mountNode, refresh, update } = await import('../context/context.util');
const { _if } = await import('./if.util');
const { CREATE_NODES } = await import('../create-nodes/create-nodes.util');
const { _SSR_MARKERS } = await import('../../costants');
const { signal } = await import('../../signals');

type Context = _Context;

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

function createRoot() {
  return _scope(null, STRUCTURAL_LAYOUT);
}

/**
 * The layout of a scope declaring some variables.
 */
const layoutOf = (count: number): _ScopeLayout => ({ size: HEADER + count, nodes: HEADER + count });

function branch(label: string, condition?: (context: Context) => unknown) {
  const block = vi.fn((parent: HTMLElement, parentContext: Context, reference: Node | null) => {
    const context = _scope(parentContext, ELEMENT_LAYOUT);
    const element = document.createElement('span');
    element.textContent = label;
    mountNode(element, parent, context, reference as Comment | null, HEADER);
    return context;
  });
  return { condition, block };
}

/**
 * Freezes an object and every object it holds, functions excluded, so that a write into it throws in strict mode.
 */
function deepFreeze<Value extends object>(value: Value): Value {
  const members = Object.values(value);
  for (let i = 0; i < members.length; i++) {
    const member: unknown = members[i];
    if (member && typeof member === 'object') {
      deepFreeze(member);
    }
  }

  return Object.freeze(value);
}

const text = (parent: HTMLElement) => Array.from(parent.querySelectorAll('span')).map(span => span.textContent);

describe('_if', () => {
  it('inserts an anchor comment', () => {
    const parent = document.createElement('div');
    _if(parent, createRoot(), null, { branches: [branch('a', () => false)] });
    expect(parent.lastChild?.textContent).toBe('if');
  });

  it('gets the block with the marker of an @if, unless another one is given', () => {
    const block = vi.spyOn(CREATE_NODES, 'block');
    const context = createRoot();
    const parent = document.createElement('div');

    _if(parent, context, null, { branches: [], slot: HEADER });
    _if(parent, context, null, { branches: [] }, _SSR_MARKERS.switch);
    _if(parent, context, null, { branches: [], last: true });

    expect(block.mock.calls).toEqual([
      [context, parent, null, 'if', _SSR_MARKERS.if, undefined, HEADER],
      [context, parent, null, 'if', _SSR_MARKERS.switch, undefined, undefined],
      [context, parent, null, 'if', _SSR_MARKERS.if, true, undefined]
    ]);
    block.mockRestore();
  });

  it('renders the last block of its parent without anchor, appending every branch it switches to at the end of the parent', async () => {
    const parent = document.createElement('div');
    parent.appendChild(document.createElement('i')).textContent = 'i';
    const value = signal(1);
    const nodes = () => Array.from(parent.childNodes).map(node => `${node.nodeName}:${node.textContent}`);
    _if(parent, createRoot(), null, { branches: [branch('a', () => value() === 1), branch('b', () => value() === 2)], last: true });

    expect(nodes()).toEqual(['I:i', 'SPAN:a']);

    value.set(2);
    await flush();
    expect(nodes()).toEqual(['I:i', 'SPAN:b']);

    value.set(9);
    await flush();
    expect(nodes()).toEqual(['I:i']);

    value.set(1);
    await flush();
    expect(nodes()).toEqual(['I:i', 'SPAN:a']);
  });

  describe('single branch', () => {
    it('renders the branch when the condition is true', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, { branches: [branch('a', () => true)] });
      expect(text(parent)).toEqual(['a']);
    });

    it('renders nothing when the condition is false', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, { branches: [branch('a', () => false)] });
      expect(text(parent)).toEqual([]);
    });

    it('toggles the branch reactively', async () => {
      const parent = document.createElement('div');
      const show = signal(true);
      const a = branch('a', () => show());
      _if(parent, createRoot(), null, { branches: [a] });

      show.set(false);
      await flush();
      expect(text(parent)).toEqual([]);

      show.set(true);
      await flush();
      expect(text(parent)).toEqual(['a']);
      expect(a.block).toHaveBeenCalledTimes(2);
    });

    it('does not re-render the branch when it stays active', async () => {
      const parent = document.createElement('div');
      const value = signal(1);
      const a = branch('a', () => value() > 0);
      _if(parent, createRoot(), null, { branches: [a] });

      value.set(2);
      await flush();

      expect(a.block).toHaveBeenCalledOnce();
    });
  });

  describe('if / else', () => {
    it('renders the if branch when the condition is true', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, { branches: [branch('a', () => true), branch('b')] });
      expect(text(parent)).toEqual(['a']);
    });

    it('renders the else branch when the condition is false', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, { branches: [branch('a', () => false), branch('b')] });
      expect(text(parent)).toEqual(['b']);
    });

    it('swaps the branches reactively, destroying the previous one', async () => {
      const parent = document.createElement('div');
      const flag = signal(true);
      _if(parent, createRoot(), null, { branches: [branch('a', () => flag()), branch('b')] });

      flag.set(false);
      await flush();
      expect(text(parent)).toEqual(['b']);

      flag.set(true);
      await flush();
      expect(text(parent)).toEqual(['a']);
    });
  });

  describe('if / else if', () => {
    it('renders the if branch when its condition is true', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, { branches: [branch('a', () => true), branch('b', () => true)] });
      expect(text(parent)).toEqual(['a']);
    });

    it('renders the else if branch when only its condition is true', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, { branches: [branch('a', () => false), branch('b', () => true)] });
      expect(text(parent)).toEqual(['b']);
    });

    it('renders nothing when no condition is true, since the second branch is not an else', () => {
      const parent = document.createElement('div');
      const b = branch('b', () => false);
      _if(parent, createRoot(), null, { branches: [branch('a', () => false), b] });

      expect(text(parent)).toEqual([]);
      expect(b.block).not.toHaveBeenCalled();
    });

    it('destroys the active branch when no condition is true anymore', async () => {
      const parent = document.createElement('div');
      const value = signal(2);
      const b = branch('b', () => value() === 2);
      _if(parent, createRoot(), null, { branches: [branch('a', () => value() === 1), b] });
      expect(text(parent)).toEqual(['b']);

      value.set(9);
      await flush();
      expect(text(parent)).toEqual([]);

      value.set(2);
      await flush();
      expect(text(parent)).toEqual(['b']);
      expect(b.block).toHaveBeenCalledTimes(2);
    });
  });

  describe('branches without a condition', () => {
    it('renders a single branch without a condition', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, { branches: [branch('a')] });
      expect(text(parent)).toEqual(['a']);
    });

    it.each([
      ['a branch with a condition', () => true],
      ['another branch without a condition', undefined]
    ])('renders a branch without a condition even when it is followed by %s', (_description, condition) => {
      const parent = document.createElement('div');
      const b = branch('b', condition);
      _if(parent, createRoot(), null, { branches: [branch('a'), b] });

      expect(text(parent)).toEqual(['a']);
      expect(b.block).not.toHaveBeenCalled();
    });
  });

  describe('if / else if / else', () => {
    const config = (value: () => number): BlockConfig => ({
      branches: [
        branch('a', () => value() === 1),
        branch('b', () => value() === 2),
        branch('c')
      ]
    });

    it('renders the first matching branch', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, config(() => 2));
      expect(text(parent)).toEqual(['b']);
    });

    it('falls back to the branch without condition', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, config(() => 3));
      expect(text(parent)).toEqual(['c']);
    });

    it('renders nothing when no branch matches', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, { branches: [branch('a', () => false), branch('b', () => false), branch('c', () => false)] });
      expect(text(parent)).toEqual([]);
    });

    it('destroys the active branch when no branch matches anymore', async () => {
      const parent = document.createElement('div');
      const value = signal(1);
      const a = branch('a', () => value() === 1);
      _if(parent, createRoot(), null, { branches: [a, branch('b', () => value() === 2), branch('c', () => value() === 3)] });

      value.set(9);
      await flush();
      expect(text(parent)).toEqual([]);

      value.set(1);
      await flush();
      expect(text(parent)).toEqual(['a']);
      expect(a.block).toHaveBeenCalledTimes(2);
    });

    it('switches branch reactively', async () => {
      const parent = document.createElement('div');
      const value = signal(1);
      _if(parent, createRoot(), null, config(() => value()));

      value.set(2);
      await flush();
      expect(text(parent)).toEqual(['b']);

      value.set(3);
      await flush();
      expect(text(parent)).toEqual(['c']);
    });
  });

  it('honours the reference node', () => {
    const parent = document.createElement('div');
    const reference = document.createComment('ref');
    parent.appendChild(reference);

    _if(parent, createRoot(), reference, { branches: [branch('a', () => true)] });

    expect(Array.from(parent.childNodes).map(node => node.textContent)).toEqual(['a', 'if', 'ref']);
  });

  it('destroys the active branch and stops reacting with the parent context', async () => {
    const parent = document.createElement('div');
    const context = createRoot();
    const show = signal(true);
    const a = branch('a', () => show());
    _if(parent, context, null, { branches: [a], slot: HEADER });

    clear(context);
    show.set(false);
    show.set(true);
    await flush();

    expect(parent.childNodes.length).toBe(0);
    expect(a.block).toHaveBeenCalledOnce();
  });

  it('calls the conditions with the component of the context as this and the context', () => {
    const component = { visible: true };
    const context = _scope(createRoot(), EMPTY_LAYOUT, undefined, component);
    const condition = vi.fn(function (this: typeof component, _context: Context) {
      return this.visible;
    });
    const parent = document.createElement('div');

    _if(parent, context, null, { branches: [branch('a', condition)] });

    expect(text(parent)).toEqual(['a']);
    expect(condition).toHaveBeenCalledOnce();
    expect(condition.mock.contexts[0]).toBe(component);
    expect(condition.mock.calls[0][0]).toBe(context);
  });

  it('follows a variable of the template its conditions read when the scope is refreshed with it', () => {
    const context = _scope(createRoot(), layoutOf(1));
    context[HEADER] = true;
    const parent = document.createElement('div');
    _if(parent, context, null, { branches: [branch('a', scope => scope[HEADER]), branch('b')], reads: [0] });

    update(context, HEADER, false);
    refresh(context, [0]);

    expect(text(parent)).toEqual(['b']);
  });

  it('shares the same config and the same conditions between two instances of the block, each reading its own context, without writing into the config', () => {
    const condition = vi.fn((scope: Context) => scope[HEADER]);
    const a = branch('a', condition);
    const b = branch('b');
    const config = deepFreeze<BlockConfig>({ branches: [a, b], reads: [0] });
    const first = _scope(createRoot(), layoutOf(1));
    const second = _scope(createRoot(), layoutOf(1));
    first[HEADER] = true;
    second[HEADER] = false;
    const firstParent = document.createElement('div');
    const secondParent = document.createElement('div');

    _if(firstParent, first, null, config);
    _if(secondParent, second, null, config);

    const scopes = new Map([[first, 'first'], [second, 'second']]);
    expect(text(firstParent)).toEqual(['a']);
    expect(text(secondParent)).toEqual(['b']);
    expect(condition.mock.calls.map(call => scopes.get(call[0]))).toEqual(['first', 'second']);

    update(second, HEADER, true);
    refresh(second, [0]);
    update(first, HEADER, false);
    refresh(first, [0]);

    expect(text(firstParent)).toEqual(['b']);
    expect(text(secondParent)).toEqual(['a']);
    expect(condition.mock.calls.map(call => scopes.get(call[0]))).toEqual(['first', 'second', 'second', 'first']);
    expect(a.block.mock.calls.map(call => scopes.get(call[1]))).toEqual(['first', 'second']);
    expect(b.block.mock.calls.map(call => scopes.get(call[1]))).toEqual(['second', 'first']);
  });
});
