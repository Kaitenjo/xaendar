// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { ForConfig } from '../../types/for-config.type';
import type { IterationVariables } from '../../types/iteration-variables.type';
import { HEADER, LAYOUT } from '../../costants';
import type { _Context } from '../../types/context.type';
import type { _ScopeLayout } from '../../types/scope-layout.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _read, _scope, clear, containerSlot, ELEMENT_LAYOUT, EMPTY_LAYOUT, mountNode, nodesEnd, refresh, update } = await import('../context/context.util');
const { _for, _iterationVariables } = await import('./for.util');
const { _if } = await import('../if/if.util');
const { _bindEffect } = await import('../../signals/effect/effect');
const { signal } = await import('../../signals');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

/*
  happy-dom has no moveBefore: it moves the node as insertBefore does, without the state-preserving semantics
  of the browsers, which keep the moved custom elements connected
*/
const moveBefore = vi.fn(function (this: Element, node: Node, child: Node | null) {
  Node.prototype.insertBefore.call(this, node, child);
});
Object.assign(Element.prototype, { moveBefore });

type Context = _Context;

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

/**
 * The layout of a scope declaring some variables, followed by some nodes and by the containers of some blocks.
 */
function layoutOf(count: number, nodes = 0, containers = 0): _ScopeLayout {
  const layout: _ScopeLayout = { size: HEADER + count + nodes + containers, nodes: HEADER + count };
  return containers ? { ...layout, containers: HEADER + count + nodes } : layout;
}

/**
 * Creates the scope rendering a `@for`, holding a node and the container of the block.
 */
function createRoot() {
  return _scope(null, layoutOf(0, 1, 1));
}

/**
 * Creates the scope of an item declaring the variables given, with room for two nodes at its top and a block.
 */
const itemScope = (parentContext: Context, variables?: IterationVariables | null) => _scope(parentContext, layoutOf(variables?.used.length ?? 0, 2, 1));

/**
 * The first slot of a scope free for a node, as the compiler gives them in order.
 */
function freeSlot(context: Context): number | undefined {
  for (let i = context[LAYOUT].nodes; i < nodesEnd(context); i++) {
    if (!context[i]) {
      return i;
    }
  }

  return undefined;
}

/**
 * Registers in a scope a binding for each identifier given, and returns the identifiers whose binding ran again since.
 */
function refreshedIds(scope: Context, ids: readonly number[]): number[] {
  const runs = new Array<number>();
  let rendering = true;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    _bindEffect(scope, () => rendering || runs.push(id), null, undefined, undefined, [id]);
  }

  rendering = false;
  return runs;
}

type Body = (parentNode: HTMLElement, itemContext: Context, text: string, reference: Node | null) => void;
type Options = { withNodes?: boolean, variables?: IterationVariables | null, body?: Body, last?: true };

/**
 * Every variable of a `@for`, declared by its own name.
 */
const ALL_VARIABLES: IterationVariables = { used: ['item', '$index', '$first', '$last', '$even', '$odd'], ids: [0, 1, 2, 3, 4, 5] };

/**
 * Reads the values of the variables an item declares.
 */
const valuesOf = (context: Context, { used }: IterationVariables = ALL_VARIABLES) => used.map((_variable, index) => context[HEADER + index]);

const renderItem: Body = (parentNode, itemContext, text, reference) => {
  const li = document.createElement('li');
  li.textContent = text;
  mountNode(li, parentNode, itemContext, reference as Comment | null, freeSlot(itemContext));
};

/**
 * Wraps `body` into `depth` nested `@if` blocks, so that the first node owned by the
 * item context is an anchor comment and the actual content lives in a descendant context.
 */
function nestedIf(depth: number, body: Body = renderItem, condition = () => true): Body {
  return depth === 0 ? body : (parentNode, itemContext, text, reference) => {
    _if(parentNode, itemContext, reference as Comment | null, {
      slot: freeSlot(itemContext),
      branches: [{
        condition,
        block: (blockParent, blockContext, blockReference) => {
          const branchContext = _scope(blockContext, layoutOf(0, 2, 1));
          nestedIf(depth - 1, body, condition)(blockParent, branchContext, text, blockReference);
          return branchContext;
        }
      }]
    });
  };
}

/**
 * Renders the item text inside an `<li>` through a child context, as the compiler does for the children of an element.
 */
const renderItemWithChildren: Body = (parentNode, itemContext, text, reference) => {
  const li = document.createElement('li');
  mountNode(li, parentNode, itemContext, reference as Comment | null, freeSlot(itemContext));
  // The scope of the children, held by the container of the item, tracks the text it renders into the element
  const children = _scope(itemContext, ELEMENT_LAYOUT);
  itemContext[containerSlot(itemContext)] = children;
  mountNode(document.createTextNode(text), li, children, null, HEADER);
};

const nodeTexts =(parent: HTMLElement) => Array.from(parent.childNodes).map(node => node.textContent);

function setup(initial: string[], { withNodes = true, variables = ALL_VARIABLES, body = renderItem, last }: Options = {}) {
  const parent = document.createElement('ul');
  if (last) {
    // The @for follows another node of its parent, which the items are appended after
    parent.appendChild(document.createElement('i')).textContent = 'i';
  }

  const context = createRoot();
  const items = signal(initial);
  // The contexts of the items created, in order of creation
  const entries = new Array<Context>();
  const forFn = vi.fn((parentNode: HTMLElement, parentContext: Context, list: unknown[], index: number, reference: Node | null) => {
    const itemContext = itemScope(parentContext, variables);
    if (variables) {
      _iterationVariables(itemContext, list, index, variables);
    }
    entries.push(itemContext);
    if (withNodes) {
      body(parentNode, itemContext, String(list[index]), reference);
    }
    return itemContext;
  });

  _for(parent, context, null, { items: () => items(), track: (_context, item) => item as string, block: forFn, variables: variables ?? undefined, last, slot: last ? undefined : HEADER });

  const texts = () => Array.from(parent.querySelectorAll('li')).map(li => li.textContent);
  const change = async (next: string[]) => {
    items.set(next);
    await flush();
  };

  return { parent, context, forFn, entries, texts, change };
}

describe('_for', () => {
  it('renders an item for each entry, in order', () => {
    const { texts, forFn } = setup(['a', 'b', 'c']);
    expect(texts()).toEqual(['a', 'b', 'c']);
    expect(forFn).toHaveBeenCalledTimes(3);
  });

  it('keeps an entry per occurrence of a repeated key', async () => {
    const { texts, forFn, change } = setup(['a', 'a', 'b']);
    expect(texts()).toEqual(['a', 'a', 'b']);

    await change(['b', 'a', 'a', 'a']);
    expect(texts()).toEqual(['b', 'a', 'a', 'a']);
    expect(forFn).toHaveBeenCalledTimes(4);

    // Three occurrences of a key kept reuse their three rows
    await change(['a', 'a', 'a', 'b']);
    expect(texts()).toEqual(['a', 'a', 'a', 'b']);
    expect(forFn).toHaveBeenCalledTimes(4);

    await change(['a', 'b']);
    expect(texts()).toEqual(['a', 'b']);
    expect(forFn).toHaveBeenCalledTimes(4);
  });

  it('passes the item, the index and the implicit variables to the track expression, as values', () => {
    const keys = new Array<unknown[]>();
    const context = createRoot();
    const track = vi.fn((_scope: Context, ...variables: unknown[]) => {
      keys.push(variables);
      return variables.join();
    });

    _for(document.createElement('ul'), context, null, { items: () => ['a', 'b', 'c'], track, block: () => _scope(createRoot(), EMPTY_LAYOUT) });

    expect(track.mock.calls.map(call => call[0] === context)).toEqual([true, true, true]);

    expect(keys).toEqual([
      ['a', 0, true, false, true, false],
      ['b', 1, false, false, false, true],
      ['c', 2, false, true, true, false]
    ]);
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

  it('moves the existing items and updates their variables in place, as values of their contexts', async () => {
    const { texts, forFn, entries, change } = setup(['a', 'b', 'c']);
    const [a, b, c] = entries;

    await change(['c', 'b', 'a']);

    expect(texts()).toEqual(['c', 'b', 'a']);
    expect(forFn).toHaveBeenCalledTimes(3);
    expect(valuesOf(c)).toEqual(['c', 0, true, false, true, false]);
    expect(valuesOf(b)).toEqual(['b', 1, false, false, false, true]);
    expect(valuesOf(a)).toEqual(['a', 2, false, true, true, false]);
  });

  it('refreshes a reused item with the identifiers of the variables that changed, and leaves alone the ones that did not change', async () => {
    const { entries, change } = setup(['a', 'b', 'c']);
    const refreshes = entries.map(entry => refreshedIds(entry, ALL_VARIABLES.ids));

    await change(['c', 'b', 'a']);

    // From the index 0 to the index 2 and back, an item stays at an even index
    expect(refreshes[0]).toEqual([1, 2, 3]);
    expect(refreshes[1]).toEqual([]);
    expect(refreshes[2]).toEqual([1, 2, 3]);
  });

  it('runs again the bindings of a reused item reading a variable that changed, synchronously', async () => {
    const { entries, change } = setup(['a', 'b']);
    const [a] = entries;
    const seen = new Array<unknown>();
    _bindEffect(a, (context: Context) => { seen.push(context[HEADER + 1]); }, a, undefined, undefined, [1]);

    await change(['b', 'a']);

    expect(seen).toEqual([0, 1]);
  });

  it('updates only the variables the body reads, in the order of the variables of the @for', async () => {
    const variables: IterationVariables = { used: ['$index', '$last'], ids: [1, 3] };
    const { entries, change } = setup(['a', 'b', 'c'], { variables });
    const [a] = entries;
    const refreshed = refreshedIds(a, [1, 3]);

    expect(valuesOf(a, variables)).toEqual([0, false]);

    await change(['b', 'c', 'a']);

    expect(valuesOf(a, variables)).toEqual([2, true]);
    expect(refreshed).toEqual([1, 3]);
  });

  it('updates the item of an entry reused for a new item with the same key', async () => {
    const parent = document.createElement('ul');
    const items = signal([{ id: 1, name: 'old' }]);
    const entries = new Array<Context>();
    const variables: IterationVariables = { used: ['item'], ids: [0] };
    _for(parent, createRoot(), null, {
      items: () => items(),
      track: (_context, item) => (item as { id: number }).id,
      block: (_parentNode, parentContext, list, index) => {
        const itemContext = itemScope(parentContext, variables);
        _iterationVariables(itemContext, list, index, variables);
        entries.push(itemContext);
        return itemContext;
      },
      variables
    });
    const refreshed = refreshedIds(entries[0], [0]);

    items.set([{ id: 1, name: 'new' }]);
    await flush();

    expect(entries).toHaveLength(1);
    expect(entries[0][HEADER]).toEqual({ id: 1, name: 'new' });
    expect(refreshed).toEqual([0]);
  });

  it('updates the variables of each occurrence of a repeated key by its own position', async () => {
    const { entries, forFn, change } = setup(['a', 'b', 'a']);
    const [firstA, b, secondA] = entries;

    await change(['a', 'a', 'b']);

    expect(forFn).toHaveBeenCalledTimes(3);
    expect(valuesOf(firstA).slice(0, 2)).toEqual(['a', 0]);
    expect(valuesOf(secondA).slice(0, 2)).toEqual(['a', 1]);
    expect(valuesOf(b)).toEqual(['b', 2, false, true, true, false]);
  });

  it('moves the nodes a reused item renders once refreshed, a block at the top of its body rendering other ones', async () => {
    const parent = document.createElement('ul');
    const items = signal([{ id: 1, done: false }, { id: 2, done: false }]);
    const variables: IterationVariables = { used: ['item'], ids: [0] };
    // The body is a block reading the item: the branch it renders, at the top of the item, changes with it
    const render = (text: string) => (blockParent: HTMLElement, blockContext: Context, blockReference: Node | null) => {
      const branchContext = _scope(blockContext, layoutOf(0, 1));
      renderItem(blockParent, branchContext, `${text}${(_read(branchContext, 1, HEADER) as { id: number }).id}`, blockReference);
      return branchContext;
    };
    _for(parent, createRoot(), null, {
      items: () => items(),
      track: (_context, item) => (item as { id: number }).id,
      block: (parentNode, parentContext, list, index, reference) => {
        const itemContext = itemScope(parentContext, variables);
        _iterationVariables(itemContext, list, index, variables);
        _if(parentNode, itemContext, reference as Comment | null, {
          branches: [
            { condition: scope => (scope[HEADER] as { done: boolean }).done, block: render('done ') },
            { block: render('todo ') }
          ],
          reads: [0],
          slot: HEADER + 1
        });
        return itemContext;
      },
      variables
    });

    items.set([{ id: 2, done: true }, { id: 1, done: false }]);
    await flush();

    expect(nodeTexts(parent)).toEqual(['done 2', 'if', 'todo 1', 'if', 'for']);
  });

  it('reuses the same DOM nodes when reordering', async () => {
    const { parent, change } = setup(['a', 'b']);
    const [a, b] = Array.from(parent.querySelectorAll('li'));

    await change(['b', 'a']);

    expect(Array.from(parent.querySelectorAll('li'))).toEqual([b, a]);
  });

  it('moves the nodes with moveBefore, which keeps them in the document', async () => {
    const { parent, change } = setup(['a', 'b']);
    const a = parent.querySelector('li');
    const insertBefore = vi.spyOn(parent, 'insertBefore');
    moveBefore.mockClear();

    await change(['b', 'a']);

    expect(moveBefore).toHaveBeenCalledExactlyOnceWith(a, expect.any(Comment));
    expect(moveBefore.mock.contexts[0]).toBe(parent);
    expect(insertBefore).not.toHaveBeenCalled();
  });

  it('moves the items of a body reading no variable, which declare none', async () => {
    const { texts, entries, change } = setup(['a', 'b'], { variables: null });

    await change(['b', 'a']);

    expect(texts()).toEqual(['b', 'a']);
    expect(entries.map(entry => entry[LAYOUT].nodes)).toEqual([HEADER, HEADER]);
  });

  it('works when the items do not own any node', async () => {
    const { parent, forFn, change } = setup(['a', 'b'], { withNodes: false });

    await change(['b', 'a', 'c']);

    expect(forFn).toHaveBeenCalledTimes(3);
    expect(parent.querySelectorAll('li').length).toBe(0);
  });

  describe('when the item content is rendered by a nested context', () => {
    it('inserts the previous item before the first rendered node of the next one', () => {
      const { parent, texts } = setup(['a', 'b', 'c'], { body: nestedIf(1) });

      expect(texts()).toEqual(['a', 'b', 'c']);
      expect(nodeTexts(parent)).toEqual(['a', 'if', 'b', 'if', 'c', 'if', 'for']);
    });

    it('descends through several levels of nested contexts', () => {
      const { texts } = setup(['a', 'b', 'c'], { body: nestedIf(3) });
      expect(texts()).toEqual(['a', 'b', 'c']);
    });

    it('keeps the order when new items are added', async () => {
      const { texts, change } = setup(['b', 'd'], { body: nestedIf(2) });

      await change(['a', 'b', 'c', 'd']);

      expect(texts()).toEqual(['a', 'b', 'c', 'd']);
    });

    it('moves the nodes of the nested contexts when reordering', async () => {
      const { parent, texts, change } = setup(['a', 'b', 'c'], { body: nestedIf(2) });
      const [a, b, c] = Array.from(parent.querySelectorAll('li'));

      await change(['c', 'a', 'b']);

      expect(texts()).toEqual(['c', 'a', 'b']);
      expect(Array.from(parent.querySelectorAll('li'))).toEqual([c, a, b]);
      expect(nodeTexts(parent)).toEqual(['c', 'if', 'if', 'a', 'if', 'if', 'b', 'if', 'if', 'for']);
    });

    it('moves the nested content placed between the own nodes of the item', async () => {
      const body: Body = (parentNode, itemContext, text, reference) => {
        renderItem(parentNode, itemContext, text, reference);
        nestedIf(1)(parentNode, itemContext, `${text}!`, reference);
      };
      const { parent, change } = setup(['a', 'b'], { body });

      await change(['b', 'a']);

      expect(nodeTexts(parent)).toEqual(['b', 'b!', 'if', 'a', 'a!', 'if', 'for']);
    });

    it('ignores the contexts rendering into the children of an element', async () => {
      const body: Body = (parentNode, itemContext, text, reference) => {
        nestedIf(1, renderItem, () => false)(parentNode, itemContext, text, reference);
        renderItemWithChildren(parentNode, itemContext, text, reference);
      };
      const { parent, texts, change } = setup(['a', 'b'], { body });

      expect(nodeTexts(parent)).toEqual(['if', 'a', 'if', 'b', 'for']);

      await change(['b', 'a']);

      expect(texts()).toEqual(['b', 'a']);
      expect(nodeTexts(parent)).toEqual(['if', 'b', 'if', 'a', 'for']);
    });

    it('falls back to the anchor when the nested context is not rendered', () => {
      const { parent } = setup(['a', 'b'], { body: nestedIf(1, renderItem, () => false) });
      expect(nodeTexts(parent)).toEqual(['if', 'if', 'for']);
    });

    it('falls back to the last anchor when the nested context does not own any node', () => {
      const { parent } = setup(['a', 'b'], { body: nestedIf(2, () => {}) });
      expect(nodeTexts(parent)).toEqual(['if', 'if', 'if', 'if', 'for']);
    });
  });

  describe('as the last node of its parent', () => {
    it('renders its items without anchor, appended to the parent', () => {
      const { parent, forFn } = setup(['a', 'b'], { last: true });

      expect(nodeTexts(parent)).toEqual(['i', 'a', 'b']);
      expect(forFn.mock.calls.map(call => call[4])).toEqual([null, null]);
    });

    it('renders nothing but the other nodes of the parent for an empty list', () => {
      const { parent } = setup([], { last: true });
      expect(nodeTexts(parent)).toEqual(['i']);
    });

    it('appends the items added, and inserts the ones before the existing ones', async () => {
      const { parent, forFn, change } = setup(['b', 'd'], { last: true });

      await change(['a', 'b', 'c', 'd', 'e']);

      expect(nodeTexts(parent)).toEqual(['i', 'a', 'b', 'c', 'd', 'e']);
      expect(forFn).toHaveBeenCalledTimes(5);
      expect(forFn.mock.calls[2][4]).toBeNull();
    });

    it('removes the items that disappeared', async () => {
      const { parent, change } = setup(['a', 'b', 'c'], { last: true });

      await change(['b']);
      expect(nodeTexts(parent)).toEqual(['i', 'b']);

      await change([]);
      expect(nodeTexts(parent)).toEqual(['i']);
    });

    it('reorders the items, moving the last one to the end of the parent, reusing their nodes', async () => {
      const { parent, change } = setup(['a', 'b', 'c'], { last: true });
      const [a, b, c] = Array.from(parent.querySelectorAll('li'));
      moveBefore.mockClear();

      await change(['c', 'a', 'b']);

      expect(nodeTexts(parent)).toEqual(['i', 'c', 'a', 'b']);
      expect(Array.from(parent.querySelectorAll('li'))).toEqual([c, a, b]);

      await change(['b', 'c', 'a']);

      expect(nodeTexts(parent)).toEqual(['i', 'b', 'c', 'a']);
      expect(moveBefore.mock.calls.some(call => call[1] === null)).toBe(true);
    });

    it('keeps the order of items rendered by nested contexts', async () => {
      const { parent, texts, change } = setup(['a', 'b', 'c'], { body: nestedIf(1), last: true });

      await change(['c', 'a', 'd', 'b']);

      expect(texts()).toEqual(['c', 'a', 'd', 'b']);
      expect(nodeTexts(parent)).toEqual(['i', 'c', 'if', 'a', 'if', 'd', 'if', 'b', 'if']);
    });
  });

  it('iterates a number n as the indexes from 0 to n - 1', async () => {
    const parent = document.createElement('ul');
    const count = signal(3);
    const forFn = vi.fn((parentNode: HTMLElement, parentContext: Context, list: unknown[], index: number, reference: Node | null) => {
      const itemContext = itemScope(parentContext);
      renderItem(parentNode, itemContext, String(list[index]), reference);
      return itemContext;
    });
    const texts = () => Array.from(parent.querySelectorAll('li')).map(li => li.textContent);

    _for(parent, createRoot(), null, { items: () => count(), track: (_context, _item, index) => index, block: forFn });
    expect(texts()).toEqual(['0', '1', '2']);

    count.set(5);
    await flush();
    expect(texts()).toEqual(['0', '1', '2', '3', '4']);
    expect(forFn).toHaveBeenCalledTimes(5);

    count.set(0);
    await flush();
    expect(texts()).toEqual([]);
  });

  it('reconciles its items again when a variable of the enclosing scope they read changes', () => {
    const parent = document.createElement('ul');
    const rowContext = _scope(createRoot(), layoutOf(1));
    rowContext[HEADER] = { cells: ['a', 'b'] };
    const forFn = vi.fn((parentNode: HTMLElement, parentContext: Context, list: unknown[], index: number, reference: Node | null) => {
      const itemContext = itemScope(parentContext);
      renderItem(parentNode, itemContext, String(list[index]), reference);
      return itemContext;
    });
    const texts = () => Array.from(parent.querySelectorAll('li')).map(li => li.textContent);

    _for(parent, rowContext, null, { items: scope => (scope[HEADER] as { cells: string[] }).cells, track: (_context, item) => item as string, block: forFn, reads: [0] });
    expect(texts()).toEqual(['a', 'b']);

    update(rowContext, HEADER, { cells: ['b', 'c'] });
    refresh(rowContext, [0]);

    expect(texts()).toEqual(['b', 'c']);
    expect(forFn).toHaveBeenCalledTimes(3);
  });

  it('stops reacting and cleans up when the parent context is destroyed', async () => {
    const { parent, context, forFn, change } = setup(['a']);

    clear(context);
    await change(['a', 'b']);

    expect(parent.childNodes.length).toBe(0);
    expect(forFn).toHaveBeenCalledOnce();
  });

  it('calls the items and the track expression with the component of the context as this and the context', () => {
    const component = { rows: [{ id: 1 }, { id: 2 }] };
    const context = _scope(createRoot(), EMPTY_LAYOUT, undefined, component);
    const items = vi.fn(function (this: typeof component, _context: Context) {
      return this.rows;
    });
    const track = vi.fn(function (this: typeof component, _scope: Context, item: unknown) {
      return (item as { id: number }).id;
    });

    _for(document.createElement('ul'), context, null, { items, track, block: (_parentNode, parentContext) => itemScope(parentContext) });

    expect(items).toHaveBeenCalledOnce();
    expect(items.mock.contexts[0]).toBe(component);
    expect(items.mock.calls[0][0]).toBe(context);
    expect(track).toHaveBeenCalledTimes(2);
    expect(track.mock.contexts).toEqual([component, component]);
    expect(track.mock.calls.map(call => call[0] === context)).toEqual([true, true]);
  });

  it('shares the same config and the same functions between two instances of the @for, each reading its own context, without writing into the config', () => {
    const variables: IterationVariables = { used: ['item'], ids: [1] };
    const items = vi.fn((scope: Context) => scope[HEADER] as string[]);
    const track = vi.fn((_scope: Context, item: unknown) => item as string);
    const block = vi.fn((parentNode: HTMLElement, parentContext: Context, list: unknown[], index: number, reference: Node | null) => {
      const itemContext = itemScope(parentContext, variables);
      _iterationVariables(itemContext, list, index, variables);
      renderItem(parentNode, itemContext, String(list[index]), reference);
      return itemContext;
    });
    const config = deepFreeze<ForConfig>({ items, track, block, variables, reads: [0] });
    const first = _scope(createRoot(), layoutOf(1));
    const second = _scope(createRoot(), layoutOf(1));
    first[HEADER] = ['a', 'b'];
    second[HEADER] = ['c'];
    const firstParent = document.createElement('ul');
    const secondParent = document.createElement('ul');
    const texts = (parent: HTMLElement) => Array.from(parent.querySelectorAll('li')).map(li => li.textContent);

    _for(firstParent, first, null, config);
    _for(secondParent, second, null, config);

    expect(texts(firstParent)).toEqual(['a', 'b']);
    expect(texts(secondParent)).toEqual(['c']);

    update(second, HEADER, ['d', 'c']);
    refresh(second, [0]);
    update(first, HEADER, ['b', 'a']);
    refresh(first, [0]);

    const scopes = new Map([[first, 'first'], [second, 'second']]);
    expect(texts(firstParent)).toEqual(['b', 'a']);
    expect(texts(secondParent)).toEqual(['d', 'c']);
    expect(items.mock.calls.map(call => scopes.get(call[0]))).toEqual(['first', 'second', 'second', 'first']);
    expect(track.mock.calls.map(call => scopes.get(call[0]))).toEqual(['first', 'first', 'second', 'second', 'second', 'first', 'first']);
    expect(block.mock.calls.map(call => scopes.get(call[1]))).toEqual(['first', 'first', 'second', 'second']);
  });
});

describe('_iterationVariables', () => {
  it('declares the variables in the context, as values, in the order of used', () => {
    const context = _scope(null, layoutOf(6));
    _iterationVariables(context, ['a', 'b', 'c'], 1, ALL_VARIABLES);

    expect(valuesOf(context)).toEqual(['b', 1, false, false, false, true]);
  });

  it('flags the first and last items', () => {
    const first = _scope(null, layoutOf(6));
    const last = _scope(null, layoutOf(6));
    _iterationVariables(first, ['a', 'b'], 0, ALL_VARIABLES);
    _iterationVariables(last, ['a', 'b'], 1, ALL_VARIABLES);

    expect(valuesOf(first)).toEqual(['a', 0, true, false, true, false]);
    expect(valuesOf(last)).toEqual(['b', 1, false, true, false, true]);
  });

  it('writes only the variables listed, in the first slots of the context, in the order of used', () => {
    const context = _scope(null, layoutOf(3));
    _iterationVariables(context, ['a', 'b', 'c'], 2, { used: ['item', '$index', '$last'], ids: [0, 1, 3] });

    expect(context.slice(HEADER)).toEqual(['c', 2, true]);
  });
});
