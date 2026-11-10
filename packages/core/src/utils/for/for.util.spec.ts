// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { IterationVariables } from '../../types/iteration-variables.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context, mountNode } = await import('../context/context.util');
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

type Context = InstanceType<typeof _Context>;

function createRoot() {
  return new _Context({ createElement: (tag: string) => document.createElement(tag) } as never);
}

type Body = (parentNode: HTMLElement, itemContext: Context, text: string, reference: Node | null) => void;
type Options = { withNodes?: boolean, variables?: IterationVariables | null, body?: Body };

/**
 * Every variable of a `@for`, declared by its own name.
 */
const ALL_VARIABLES: IterationVariables = { used: ['item', '$index', '$first', '$last', '$even', '$odd'], names: ['item', '$index', '$first', '$last', '$even', '$odd'] };

/**
 * Reads the values of the variables an item declares.
 */
const valuesOf = (context: Context, { names }: IterationVariables = ALL_VARIABLES) => names.map(name => context.get(name));

const renderItem: Body = (parentNode, itemContext, text, reference) => {
  const li = document.createElement('li');
  li.textContent = text;
  mountNode(li, parentNode, itemContext, reference as Comment | null);
};

/**
 * Wraps `body` into `depth` nested `@if` blocks, so that the first node owned by the
 * item context is an anchor comment and the actual content lives in a descendant context.
 */
function nestedIf(depth: number, body: Body = renderItem, condition = () => true): Body {
  return depth === 0 ? body : (parentNode, itemContext, text, reference) => {
    _if(parentNode, itemContext, reference as Comment | null, [{
      condition,
      block: (blockParent, blockContext, blockReference) => {
        const branchContext = new _Context(blockContext);
        nestedIf(depth - 1, body, condition)(blockParent, branchContext, text, blockReference);
        return branchContext;
      }
    }]);
  };
}

/**
 * Renders the item text inside an `<li>` through a child context, as the compiler does for the children of an element.
 */
const renderItemWithChildren: Body = (parentNode, itemContext, text, reference) => {
  const li = document.createElement('li');
  mountNode(li, parentNode, itemContext, reference as Comment | null);
  mountNode(document.createTextNode(text), li, itemContext.addChild());
};

const nodeTexts =(parent: HTMLElement) => Array.from(parent.childNodes).map(node => node.textContent);

function setup(initial: string[], { withNodes = true, variables = ALL_VARIABLES, body = renderItem }: Options = {}) {
  const parent = document.createElement('ul');
  const context = createRoot();
  const items = signal(initial);
  // The contexts of the items created, in order of creation
  const entries = new Array<Context>();
  const forFn = vi.fn((parentNode: HTMLElement, parentContext: Context, list: unknown[], index: number, reference: Node | null) => {
    const itemContext = new _Context(parentContext);
    if (variables) {
      _iterationVariables(itemContext, list, index, variables);
    }
    entries.push(itemContext);
    if (withNodes) {
      body(parentNode, itemContext, String(list[index]), reference);
    }
    return itemContext;
  });

  _for(parent, context, null, () => items(), item => item as string, forFn as never, variables ?? undefined);

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

    await change(['a', 'b']);
    expect(texts()).toEqual(['a', 'b']);
    expect(forFn).toHaveBeenCalledTimes(4);
  });

  it('passes the item, the index and the implicit variables to the track expression, as values', () => {
    const keys = new Array<unknown[]>();
    const track = (...variables: unknown[]) => {
      keys.push(variables);
      return variables.join();
    };

    _for(document.createElement('ul'), createRoot(), null, () => ['a', 'b', 'c'], track as never, () => new _Context(createRoot()));

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

  it('refreshes a reused item with the names of the variables that changed, and leaves alone the ones that did not change', async () => {
    const { entries, change } = setup(['a', 'b', 'c']);
    const [a, b, c] = entries;
    const refreshes = [vi.spyOn(a, 'refresh'), vi.spyOn(b, 'refresh'), vi.spyOn(c, 'refresh')];

    await change(['c', 'b', 'a']);

    // From the index 0 to the index 2 and back, an item stays at an even index
    expect(refreshes[0]).toHaveBeenCalledExactlyOnceWith(['$index', '$first', '$last']);
    expect(refreshes[1]).not.toHaveBeenCalled();
    expect(refreshes[2]).toHaveBeenCalledExactlyOnceWith(['$index', '$first', '$last']);
  });

  it('runs again the bindings of a reused item reading a variable that changed, synchronously', async () => {
    const { entries, change } = setup(['a', 'b']);
    const [a] = entries;
    const seen = new Array<unknown>();
    _bindEffect(a, (context: Context) => { seen.push(context.get('$index')); }, a, undefined, undefined, ['$index']);

    await change(['b', 'a']);

    expect(seen).toEqual([0, 1]);
  });

  it('updates only the variables the body reads, in the order of the variables of the @for', async () => {
    const variables: IterationVariables = { used: ['$index', '$last'], names: ['i', 'last'] };
    const { entries, change } = setup(['a', 'b', 'c'], { variables });
    const [a] = entries;
    const refresh = vi.spyOn(a, 'refresh');

    expect(valuesOf(a, variables)).toEqual([0, false]);

    await change(['b', 'c', 'a']);

    expect(valuesOf(a, variables)).toEqual([2, true]);
    expect(refresh).toHaveBeenCalledExactlyOnceWith(['i', 'last']);
  });

  it('updates the item of an entry reused for a new item with the same key', async () => {
    const parent = document.createElement('ul');
    const items = signal([{ id: 1, name: 'old' }]);
    const entries = new Array<Context>();
    const variables: IterationVariables = { used: ['item'], names: ['row'] };
    _for(parent, createRoot(), null, () => items(), item => (item as { id: number }).id, (_parentNode, parentContext, list, index) => {
      const itemContext = new _Context(parentContext);
      _iterationVariables(itemContext, list, index, variables);
      entries.push(itemContext);
      return itemContext;
    }, variables);
    const refresh = vi.spyOn(entries[0], 'refresh');

    items.set([{ id: 1, name: 'new' }]);
    await flush();

    expect(entries).toHaveLength(1);
    expect(entries[0].get('row')).toEqual({ id: 1, name: 'new' });
    expect(refresh).toHaveBeenCalledExactlyOnceWith(['row']);
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
    const variables: IterationVariables = { used: ['item'], names: ['row'] };
    // The body is a block reading the item: the branch it renders, at the top of the item, changes with it
    const render = (text: string) => (blockParent: HTMLElement, blockContext: Context, blockReference: Node | null) => {
      const branchContext = new _Context(blockContext);
      renderItem(blockParent, branchContext, `${text}${(branchContext.get('row') as { id: number }).id}`, blockReference);
      return branchContext;
    };
    _for(parent, createRoot(), null, () => items(), item => (item as { id: number }).id, (parentNode, parentContext, list, index, reference) => {
      const itemContext = new _Context(parentContext);
      _iterationVariables(itemContext, list, index, variables);
      _if(parentNode, itemContext, reference as Comment | null, [
        { condition: () => (itemContext.get('row') as { done: boolean }).done, block: render('done ') },
        { block: render('todo ') }
      ], ['row']);
      return itemContext;
    }, variables);

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
    const refreshes = entries.map(entry => vi.spyOn(entry, 'refresh'));

    await change(['b', 'a']);

    expect(texts()).toEqual(['b', 'a']);
    expect(refreshes[0]).not.toHaveBeenCalled();
    expect(refreshes[1]).not.toHaveBeenCalled();
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

  it('iterates a number n as the indexes from 0 to n - 1', async () => {
    const parent = document.createElement('ul');
    const count = signal(3);
    const forFn = vi.fn((parentNode: HTMLElement, parentContext: Context, list: unknown[], index: number, reference: Node | null) => {
      const itemContext = new _Context(parentContext);
      renderItem(parentNode, itemContext, String(list[index]), reference);
      return itemContext;
    });
    const texts = () => Array.from(parent.querySelectorAll('li')).map(li => li.textContent);

    _for(parent, createRoot(), null, () => count(), (_item, index) => index, forFn as never);
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
    const rowContext = new _Context(createRoot(), undefined, 1);
    rowContext.addIdentifier('row', { cells: ['a', 'b'] });
    const forFn = vi.fn((parentNode: HTMLElement, parentContext: Context, list: unknown[], index: number, reference: Node | null) => {
      const itemContext = new _Context(parentContext);
      renderItem(parentNode, itemContext, String(list[index]), reference);
      return itemContext;
    });
    const texts = () => Array.from(parent.querySelectorAll('li')).map(li => li.textContent);

    _for(parent, rowContext, null, () => (rowContext.get('row') as { cells: string[] }).cells, item => item as string, forFn as never, undefined, ['row']);
    expect(texts()).toEqual(['a', 'b']);

    rowContext.update('row', { cells: ['b', 'c'] });
    rowContext.refresh(['row']);

    expect(texts()).toEqual(['b', 'c']);
    expect(forFn).toHaveBeenCalledTimes(3);
  });

  it('stops reacting and cleans up when the parent context is destroyed', async () => {
    const { parent, context, forFn, change } = setup(['a']);

    context.clear();
    await change(['a', 'b']);

    expect(parent.childNodes.length).toBe(0);
    expect(forFn).toHaveBeenCalledOnce();
  });
});

describe('_iterationVariables', () => {
  it('declares the variables in the context, as values, in the order of used', () => {
    const context = createRoot();
    _iterationVariables(context, ['a', 'b', 'c'], 1, ALL_VARIABLES);

    expect(valuesOf(context)).toEqual(['b', 1, false, false, false, true]);
  });

  it('flags the first and last items', () => {
    const first = createRoot();
    const last = createRoot();
    _iterationVariables(first, ['a', 'b'], 0, ALL_VARIABLES);
    _iterationVariables(last, ['a', 'b'], 1, ALL_VARIABLES);

    expect(valuesOf(first)).toEqual(['a', 0, true, false, true, false]);
    expect(valuesOf(last)).toEqual(['b', 1, false, true, false, true]);
  });

  it('declares each variable by its name, honouring the aliases, and only the variables listed', () => {
    const context = createRoot();
    const addIdentifier = vi.spyOn(context, 'addIdentifier');
    _iterationVariables(context, ['a', 'b', 'c'], 2, { used: ['item', '$index', '$last'], names: ['row', 'i', '$last'] });

    expect(addIdentifier.mock.calls).toEqual([['row', 'c'], ['i', 2], ['$last', true]]);
  });
});
