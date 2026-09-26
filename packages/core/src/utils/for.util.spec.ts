// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context, mountNode } = await import('./context.util');
const { _for, _iterationVariables } = await import('./for.util');
const { effect, signal } = await import('../signals');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

function createRoot() {
  return new _Context({} as never, { createElement: (tag: string) => document.createElement(tag) } as never);
}

type Options = { withNodes?: boolean, withUpdate?: boolean };

function setup(initial: string[], { withNodes = true, withUpdate = true }: Options = {}) {
  const parent = document.createElement('ul');
  const context = createRoot();
  const items = signal(initial);
  const update = vi.fn();
  const forFn = vi.fn((parentNode: HTMLElement, parentContext: InstanceType<typeof _Context>, list: unknown[], index: number, reference: Node | null) => {
    const itemContext = new _Context({} as never, parentContext);
    if (withNodes) {
      const li = document.createElement('li');
      li.textContent = String(list[index]);
      mountNode(li, parentNode, itemContext, reference as Comment | null);
    }
    return { context: itemContext, update: withUpdate ? update : undefined };
  });

  _for(parent, context, null, () => items(), item => item as string, forFn as never);

  const texts = () => Array.from(parent.querySelectorAll('li')).map(li => li.textContent);
  const change = async (next: string[]) => {
    items.set(next);
    await flush();
  };

  return { parent, context, forFn, update, texts, change };
}

describe('_for', () => {
  it('renders an item for each entry, in order', () => {
    const { texts, forFn } = setup(['a', 'b', 'c']);
    expect(texts()).toEqual(['a', 'b', 'c']);
    expect(forFn).toHaveBeenCalledTimes(3);
  });

  it('renders nothing for an empty list', () => {
    expect(setup([]).texts()).toEqual([]);
  });

  it('inserts an anchor comment at the given position', () => {
    const { parent } = setup([]);
    expect(parent.lastChild?.textContent).toBe('for');
  });

  it('adds new items without recreating the existing ones', async () => {
    const { texts, forFn, change } = setup(['a', 'b']);

    await change(['a', 'b', 'c']);

    expect(texts()).toEqual(['a', 'b', 'c']);
    expect(forFn).toHaveBeenCalledTimes(3);
  });

  it('prepends new items keeping the existing nodes in place', async () => {
    const { texts, forFn, change } = setup(['b', 'c']);

    await change(['a', 'b', 'c']);

    expect(texts()).toEqual(['a', 'b', 'c']);
    expect(forFn).toHaveBeenCalledTimes(3);
  });

  it('removes and destroys the items that disappeared', async () => {
    const { texts, change } = setup(['a', 'b', 'c']);

    await change(['a', 'c']);

    expect(texts()).toEqual(['a', 'c']);
  });

  it('moves the existing items and updates their implicit variables', async () => {
    const { texts, forFn, update, change } = setup(['a', 'b', 'c']);

    await change(['c', 'b', 'a']);

    expect(texts()).toEqual(['c', 'b', 'a']);
    expect(forFn).toHaveBeenCalledTimes(3);
    expect(update).toHaveBeenCalledWith(0, ['c', 'b', 'a']);
    expect(update).toHaveBeenCalledWith(2, ['c', 'b', 'a']);
  });

  it('reuses the same DOM nodes when reordering', async () => {
    const { parent, change } = setup(['a', 'b']);
    const [a, b] = Array.from(parent.querySelectorAll('li'));

    await change(['b', 'a']);

    expect(Array.from(parent.querySelectorAll('li'))).toEqual([b, a]);
  });

  it('works when the items do not provide an update function', async () => {
    const { texts, change } = setup(['a', 'b'], { withUpdate: false });

    await change(['b', 'a']);

    expect(texts()).toEqual(['b', 'a']);
  });

  it('works when the items do not own any node', async () => {
    const { parent, forFn, change } = setup(['a', 'b'], { withNodes: false });

    await change(['b', 'a', 'c']);

    expect(forFn).toHaveBeenCalledTimes(3);
    expect(parent.querySelectorAll('li').length).toBe(0);
  });

  it('stops reacting and cleans up when the parent context is destroyed', async () => {
    const { parent, context, forFn, change } = setup(['a']);

    context.unlisten();
    await change(['a', 'b']);

    expect(parent.childNodes.length).toBe(0);
    expect(forFn).toHaveBeenCalledOnce();
  });
});

describe('_iterationVariables', () => {
  const aliases = { $index: '$index', $first: '$first', $last: '$last', $even: '$even', $odd: '$odd' };

  it('exposes the item and the implicit variables as signals', () => {
    const context = createRoot();
    const { vars } = _iterationVariables(context, ['a', 'b', 'c'], 1, 'item', aliases);

    expect(vars.item).toBe('b');
    expect((vars.$index as () => number)()).toBe(1);
    expect((vars.$first as () => boolean)()).toBe(false);
    expect((vars.$last as () => boolean)()).toBe(false);
    expect((vars.$even as () => boolean)()).toBe(false);
    expect((vars.$odd as () => boolean)()).toBe(true);
  });

  it('flags the first and last items', () => {
    const first = _iterationVariables(createRoot(), ['a', 'b'], 0, 'item', aliases).vars;
    const last = _iterationVariables(createRoot(), ['a', 'b'], 1, 'item', aliases).vars;

    expect((first.$first as () => boolean)()).toBe(true);
    expect((first.$even as () => boolean)()).toBe(true);
    expect((last.$last as () => boolean)()).toBe(true);
  });

  it('registers every variable in the context, honouring the aliases', () => {
    const context = createRoot();
    _iterationVariables(context, ['a'], 0, 'x', { ...aliases, $index: 'i' });

    expect(context.get('x')).toBe('a');
    expect(context.get('i')).toBeDefined();
    expect(context.get('$first')).toBeDefined();
  });

  it('updates the signals in place', async () => {
    const context = createRoot();
    const handle = _iterationVariables(context, ['a', 'b', 'c'], 0, 'item', aliases);
    const seen = new Array<number>();
    effect(() => { seen.push((handle.vars.$index as () => number)()); });

    handle.update(2, ['a', 'b', 'c']);
    await flush();

    expect(seen).toEqual([0, 2]);
    expect((handle.vars.$first as () => boolean)()).toBe(false);
    expect((handle.vars.$last as () => boolean)()).toBe(true);
    expect((handle.vars.$even as () => boolean)()).toBe(true);
    expect((handle.vars.$odd as () => boolean)()).toBe(false);
  });
});
