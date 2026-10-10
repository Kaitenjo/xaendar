// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context, mountNode } = await import('../context/context.util');
const { _for, _iterationVariables } = await import('./for.util');
const { _if } = await import('../if/if.util');
const { effect, signal } = await import('../../signals');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

function createRoot() {
  return new _Context({ createElement: (tag: string) => document.createElement(tag) } as never);
}

type Body = (parentNode: HTMLElement, itemContext: InstanceType<typeof _Context>, text: string, reference: Node | null) => void;
type Options = { withNodes?: boolean, withUpdate?: boolean, body?: Body };

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

function setup(initial: string[], { withNodes = true, withUpdate = true, body = renderItem }: Options = {}) {
  const parent = document.createElement('ul');
  const context = createRoot();
  const items = signal(initial);
  const update = vi.fn();
  const forFn = vi.fn((parentNode: HTMLElement, parentContext: InstanceType<typeof _Context>, list: unknown[], index: number, reference: Node | null) => {
    const itemContext = new _Context(parentContext);
    if (withNodes) {
      body(parentNode, itemContext, String(list[index]), reference);
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
    const forFn = vi.fn((parentNode: HTMLElement, parentContext: InstanceType<typeof _Context>, list: unknown[], index: number, reference: Node | null) => {
      const itemContext = new _Context(parentContext);
      renderItem(parentNode, itemContext, String(list[index]), reference);
      return { context: itemContext };
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

  it('stops reacting and cleans up when the parent context is destroyed', async () => {
    const { parent, context, forFn, change } = setup(['a']);

    context.clear();
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

  it('does not register an item when no item alias is declared', () => {
    const context = createRoot();
    const { vars } = _iterationVariables(context, [0, 1], 1, undefined, aliases);

    expect(Object.keys(vars)).toEqual(['$index', '$first', '$last', '$even', '$odd']);
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
