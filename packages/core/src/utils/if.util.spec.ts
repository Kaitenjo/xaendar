// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context, mountNode } = await import('./context.util');
const { _if } = await import('./if.util');
const { signal } = await import('../signals');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

function createRoot() {
  return new _Context({} as never, { createElement: (tag: string) => document.createElement(tag) } as never);
}

function branch(label: string, condition?: () => boolean) {
  const block = vi.fn((parent: HTMLElement, parentContext: InstanceType<typeof _Context>, reference: Node | null) => {
    const context = new _Context({} as never, parentContext);
    const element = document.createElement('span');
    element.textContent = label;
    mountNode(element, parent, context, reference as Comment | null);
    return context;
  });
  return { condition, block };
}

const text = (parent: HTMLElement) => Array.from(parent.querySelectorAll('span')).map(span => span.textContent);

describe('_if', () => {
  it('inserts an anchor comment', () => {
    const parent = document.createElement('div');
    _if(parent, createRoot(), null, [branch('a', () => false)]);
    expect(parent.lastChild?.textContent).toBe('if');
  });

  describe('single branch', () => {
    it('renders the branch when the condition is true', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, [branch('a', () => true)]);
      expect(text(parent)).toEqual(['a']);
    });

    it('renders nothing when the condition is false', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, [branch('a', () => false)]);
      expect(text(parent)).toEqual([]);
    });

    it('toggles the branch reactively', async () => {
      const parent = document.createElement('div');
      const show = signal(true);
      const a = branch('a', () => show());
      _if(parent, createRoot(), null, [a]);

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
      _if(parent, createRoot(), null, [a]);

      value.set(2);
      await flush();

      expect(a.block).toHaveBeenCalledOnce();
    });
  });

  describe('if / else', () => {
    it('renders the if branch when the condition is true', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, [branch('a', () => true), branch('b')]);
      expect(text(parent)).toEqual(['a']);
    });

    it('renders the else branch when the condition is false', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, [branch('a', () => false), branch('b')]);
      expect(text(parent)).toEqual(['b']);
    });

    it('swaps the branches reactively, destroying the previous one', async () => {
      const parent = document.createElement('div');
      const flag = signal(true);
      _if(parent, createRoot(), null, [branch('a', () => flag()), branch('b')]);

      flag.set(false);
      await flush();
      expect(text(parent)).toEqual(['b']);

      flag.set(true);
      await flush();
      expect(text(parent)).toEqual(['a']);
    });
  });

  describe('if / else if / else', () => {
    const blocks = (value: () => number) => [
      branch('a', () => value() === 1),
      branch('b', () => value() === 2),
      branch('c')
    ];

    it('renders the first matching branch', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, blocks(() => 2));
      expect(text(parent)).toEqual(['b']);
    });

    it('falls back to the branch without condition', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, blocks(() => 3));
      expect(text(parent)).toEqual(['c']);
    });

    it('renders nothing when no branch matches', () => {
      const parent = document.createElement('div');
      _if(parent, createRoot(), null, [branch('a', () => false), branch('b', () => false), branch('c', () => false)]);
      expect(text(parent)).toEqual([]);
    });

    it('destroys the active branch when no branch matches anymore', async () => {
      const parent = document.createElement('div');
      const value = signal(1);
      const a = branch('a', () => value() === 1);
      _if(parent, createRoot(), null, [a, branch('b', () => value() === 2), branch('c', () => value() === 3)]);

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
      _if(parent, createRoot(), null, blocks(() => value()));

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

    _if(parent, createRoot(), reference, [branch('a', () => true)]);

    expect(Array.from(parent.childNodes).map(node => node.textContent)).toEqual(['a', 'if', 'ref']);
  });

  it('destroys the active branch and stops reacting with the parent context', async () => {
    const parent = document.createElement('div');
    const context = createRoot();
    const show = signal(true);
    const a = branch('a', () => show());
    _if(parent, context, null, [a]);

    context.unlisten();
    show.set(false);
    show.set(true);
    await flush();

    expect(parent.childNodes.length).toBe(0);
    expect(a.block).toHaveBeenCalledOnce();
  });
});
