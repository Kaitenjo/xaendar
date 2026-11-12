// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { CHILDREN, CLEANUP, COMPONENT, HEADER, LAYOUT, PARENT, PARENT_NODE, STATE, STRATEGY } from '../../costants';
import { _bindEffect } from '../../signals/effect/effect';
import type { _Context } from '../../types/context.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { _ScopeLayout } from '../../types/scope-layout.type';
import { CREATE_NODES } from '../create-nodes/create-nodes.util';
import { closeTryScope, openTryScope } from '../try-scope/try-scope.util';
import { _declare, _read, _scope, _set, addChild, addCleanup, clear, createAnchor, ELEMENT_LAYOUT, EMPTY_LAYOUT, getChild, getChildCount, getNodeStrategy, moveTo, mountNode, propagate, refresh, removeChild, removeCleanup, setNodeStrategy, swapNodeStrategy, trackNode, update } from './context.util';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * The layout of a scope declaring the variables named, followed by some nodes.
 */
const layoutOf = (variables: string[], nodes = 0): _ScopeLayout => ({ size: HEADER + variables.length + nodes, nodes: HEADER + variables.length, variables });

/**
 * The child scopes of a scope, in registration order.
 */
const childrenOf = (scope: _Context): _Context[] => Array.from({ length: getChildCount(scope) }, (_item, index) => getChild(scope, index));

/**
 * The nodes a scope tracks, in the order of their slots.
 */
const nodesOf = (scope: _Context): unknown[] => scope.slice(scope[LAYOUT].nodes).filter(Boolean);

/**
 * Registers a binding of a scope reading some of its variables, by slot, as a template does: it records the values of
 * the variables at each run, and reads the signal, if any, while `readsSignal` holds.
 */
function bindVariables(scope: _Context, slots: number[], ids: number[], signal?: Signal.State<number>, readsSignal: () => boolean = () => true): unknown[][] {
  const runs = new Array<unknown[]>();
  _bindEffect(scope, (context: _Context) => {
    const values = slots.map(slot => _read(context, 0, slot));
    if (signal && readsSignal()) {
      values.push(signal.get());
    }
    runs.push(values);
  }, scope, undefined, undefined, ids);
  return runs;
}

describe('_scope', () => {
  it('creates an array of the size of its layout, its header holding the parent, the pass, the layout and nothing else', () => {
    const layout = layoutOf(['row'], 2);
    const scope = _scope(null, layout);

    expect(scope).toHaveLength(HEADER + 3);
    expect(scope[PARENT]).toBeNull();
    expect(scope[PARENT_NODE]).toBeNull();
    expect(scope[STATE]).toBe(0);
    expect(scope[COMPONENT]).toBeUndefined();
    expect(scope[STRATEGY]).toBeNull();
    expect(scope[CLEANUP]).toBeNull();
    expect(scope[LAYOUT]).toBe(layout);
    expect(scope[CHILDREN]).toBeNull();
  });

  it('gives the root of a render the component it renders, which the scopes it holds inherit', () => {
    const component = {};
    const root = _scope(null, EMPTY_LAYOUT, CREATE_NODES, component);

    expect(root[COMPONENT]).toBe(component);
    expect(_scope(root, EMPTY_LAYOUT)[COMPONENT]).toBe(component);
  });

  it('keeps null for the strategy creating the nodes, and inherits the strategy of the parent when given none', () => {
    const strategy = { name: 'claim' } as unknown as NodeStrategy;
    const parent = _scope(null, EMPTY_LAYOUT, strategy);

    expect(parent[STRATEGY]).toBe(strategy);
    expect(getNodeStrategy(parent)).toBe(strategy);
    expect(_scope(parent, EMPTY_LAYOUT)[STRATEGY]).toBe(strategy);
    expect(_scope(parent, EMPTY_LAYOUT, CREATE_NODES)[STRATEGY]).toBeNull();
    expect(getNodeStrategy(_scope(parent, EMPTY_LAYOUT, CREATE_NODES))).toBe(CREATE_NODES);
  });

  it('is collected by the @try rendering its content, and by no other', () => {
    const scope = openTryScope();
    const created = _scope(null, EMPTY_LAYOUT);
    closeTryScope(scope);
    _scope(null, EMPTY_LAYOUT);

    expect(scope.contexts).toEqual([created]);
  });
});

describe('variables', () => {
  it('reads a variable at its slot, in the scope itself or some scopes up the chain', () => {
    const root = _scope(null, layoutOf(['row']));
    root[HEADER] = 'outer';
    const inner = _scope(root, layoutOf(['row']));
    inner[HEADER] = 'inner';
    const nested = _scope(inner, EMPTY_LAYOUT);

    expect(_read(inner, 0, HEADER)).toBe('inner');
    expect(_read(nested, 1, HEADER)).toBe('inner');
    expect(_read(nested, 2, HEADER)).toBe('outer');
  });

  it('writes a variable at its slot, in the scope itself or some scopes up the chain', () => {
    const root = _scope(null, layoutOf(['field']));
    const inner = _scope(root, EMPTY_LAYOUT);

    _set(inner, 1, HEADER, 'value');
    _set(root, 0, HEADER + 0, 'other');

    expect(root[HEADER]).toBe('other');
  });

  it('throws, naming it, when an element ref or a @let is read before it is initialized', () => {
    const scope = _scope(null, layoutOf(['field', 'total']));
    _declare(scope, HEADER);
    _declare(scope, HEADER + 1, 'let');

    expect(() => _read(scope, 0, HEADER)).toThrow(new ReferenceError('Element ref "field" is read before the element it names is rendered'));
    expect(() => _read(scope, 0, HEADER + 1)).toThrow(new ReferenceError('@let "total" is read before its declaration is rendered'));

    _set(scope, 0, HEADER, 'element');
    expect(_read(scope, 0, HEADER)).toBe('element');
  });

  it('throws without a name for a scope whose layout lists none', () => {
    const scope = _scope(null, { size: HEADER + 1, nodes: HEADER + 1 });
    _declare(scope, HEADER);

    expect(() => _read(scope, 0, HEADER)).toThrow('Element ref "undefined" is read before the element it names is rendered');
  });

  it('updates a variable, telling whether it changed as Object.is compares, an initialization being no change', () => {
    const scope = _scope(null, layoutOf(['row', 'total', 'field']));
    scope[HEADER] = 1;
    _declare(scope, HEADER + 1, 'let');
    _declare(scope, HEADER + 2);

    expect(update(scope, HEADER, 1)).toBe(false);
    expect(update(scope, HEADER, 2)).toBe(true);
    expect(update(scope, HEADER, NaN)).toBe(true);
    expect(update(scope, HEADER, NaN)).toBe(false);
    expect(update(scope, HEADER + 1, 3)).toBe(false);
    expect(update(scope, HEADER + 2, 4)).toBe(false);
    expect(scope.slice(HEADER)).toEqual([NaN, 3, 4]);
  });
});

describe('children', () => {
  it('creates a scope declaring nothing when none is provided, whose parent is the scope', () => {
    const root = _scope(null, EMPTY_LAYOUT);
    const child = addChild(root);

    expect(child[PARENT]).toBe(root);
    expect(child[LAYOUT]).toBe(EMPTY_LAYOUT);
    expect(childrenOf(root)).toEqual([child]);
  });

  it('keeps a single child as it is, then the children in an array from the second, and removes any of them', () => {
    const root = _scope(null, EMPTY_LAYOUT);
    const [first, second, third] = [_scope(root, EMPTY_LAYOUT), _scope(root, EMPTY_LAYOUT), _scope(root, EMPTY_LAYOUT)];
    addChild(root, first);
    expect(root[CHILDREN]).toBe(first);
    addChild(root, second);
    addChild(root, third);
    expect(childrenOf(root)).toEqual([first, second, third]);

    removeChild(root, second);
    expect(childrenOf(root)).toEqual([first, third]);
    removeChild(root, first);
    removeChild(root, third);
    expect(getChildCount(root)).toBe(0);

    // An emptied array gets the next child as it is
    addChild(root, second);
    expect(root[CHILDREN]).toBe(second);
    removeChild(root, second);
    expect(root[CHILDREN]).toBeNull();
  });

  it('ignores a scope that is not a child', () => {
    const root = _scope(null, EMPTY_LAYOUT);
    const other = _scope(null, EMPTY_LAYOUT);
    removeChild(root, other);
    const child = addChild(root);
    removeChild(root, other);
    addChild(root);
    removeChild(root, other);

    expect(getChildCount(root)).toBe(2);
    expect(getChild(root, 0)).toBe(child);
  });
});

describe('trackNode', () => {
  it('keeps a node in its slot, and the node it is inserted into once', () => {
    const scope = _scope(null, layoutOf([], 2));
    const parent = document.createElement('div');
    const [first, second] = [document.createElement('a'), document.createElement('b')];

    trackNode(first, parent, scope, HEADER);
    trackNode(second, parent, scope, HEADER + 1);

    expect(scope[PARENT_NODE]).toBe(parent);
    expect(nodesOf(scope)).toEqual([first, second]);
  });

  it('tracks no node without a slot', () => {
    const scope = _scope(null, layoutOf([], 1));
    trackNode(document.createElement('p'), document.createElement('div'), scope, undefined);

    expect(scope[PARENT_NODE]).toBeNull();
    expect(nodesOf(scope)).toEqual([]);
  });

  it('throws in development when a node is inserted into another node than the ones it tracks', () => {
    const scope = _scope(null, layoutOf([], 2));
    trackNode(document.createElement('a'), document.createElement('div'), scope, HEADER);

    expect(() => trackNode(document.createElement('b'), document.createElement('div'), scope, HEADER + 1)).toThrow('A scope tracks the nodes inserted into a single node: this one is inserted into another node');
  });
});

describe('cleanups', () => {
  it('keeps a single cleanup as it is, then the cleanups in an array from the second, run in registration order', () => {
    const scope = _scope(null, EMPTY_LAYOUT);
    const seen = new Array<string>();
    const first = (): number => seen.push('first');
    addCleanup(scope, first);
    expect(scope[CLEANUP]).toBe(first);
    addCleanup(scope, { dispose: () => seen.push('second') });
    addCleanup(scope, () => seen.push('third'));

    clear(scope);
    clear(scope);

    expect(seen).toEqual(['first', 'second', 'third']);
  });

  it('removes a cleanup, keeping the last one left as it is', () => {
    const scope = _scope(null, EMPTY_LAYOUT);
    const [first, second, third] = [vi.fn<() => void>(), vi.fn<() => void>(), vi.fn<() => void>()];
    removeCleanup(scope, first);
    addCleanup(scope, first);
    removeCleanup(scope, second);
    removeCleanup(scope, first);
    expect(scope[CLEANUP]).toBeNull();

    addCleanup(scope, first);
    addCleanup(scope, second);
    addCleanup(scope, third);
    removeCleanup(scope, vi.fn<() => void>());
    removeCleanup(scope, second);
    expect(scope[CLEANUP]).toEqual([first, third]);
    removeCleanup(scope, first);
    expect(scope[CLEANUP]).toBe(third);

    clear(scope);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    expect(third).toHaveBeenCalledOnce();
  });
});

describe('setNodeStrategy', () => {
  it('sets the strategy of the scope and of the scopes it holds, leaving the ones holding it', () => {
    const strategy = { name: 'claim' } as unknown as NodeStrategy;
    const root = _scope(null, EMPTY_LAYOUT, strategy);
    const scope = addChild(root);
    const nested = addChild(addChild(scope));

    setNodeStrategy(scope, CREATE_NODES);

    expect(root[STRATEGY]).toBe(strategy);
    expect(scope[STRATEGY]).toBeNull();
    expect(nested[STRATEGY]).toBeNull();
  });

  it('swaps the strategy of the scope alone', () => {
    const strategy = { name: 'claim' } as unknown as NodeStrategy;
    const scope = _scope(null, EMPTY_LAYOUT);
    const child = addChild(scope);

    swapNodeStrategy(scope, strategy);

    expect(scope[STRATEGY]).toBe(strategy);
    expect(child[STRATEGY]).toBeNull();
  });
});

describe('moveTo', () => {
  it('moves the cleanups and the children to another scope, leaving it empty', () => {
    const [staging, target] = [_scope(null, EMPTY_LAYOUT), _scope(null, EMPTY_LAYOUT)];
    const [first, second] = [vi.fn<() => void>(), vi.fn<() => void>()];
    addCleanup(staging, first);
    addCleanup(staging, second);
    const child = addChild(staging);

    moveTo(staging, target);

    expect(staging[CLEANUP]).toBeNull();
    expect(staging[CHILDREN]).toBeNull();
    expect(target[CLEANUP]).toEqual([first, second]);
    expect(childrenOf(target)).toEqual([child]);
  });

  it('moves a single cleanup, and nothing from a scope without cleanups', () => {
    const [staging, target] = [_scope(null, EMPTY_LAYOUT), _scope(null, EMPTY_LAYOUT)];
    moveTo(staging, target);
    expect(target[CLEANUP]).toBeNull();

    const cleanup = vi.fn();
    addCleanup(staging, cleanup);
    moveTo(staging, target);
    expect(target[CLEANUP]).toBe(cleanup);
  });
});

describe('clear', () => {
  it('removes each node from the node it is inserted into, from the last to the first, before running the cleanups and clearing the children, then empties its slots', () => {
    const scope = _scope(null, layoutOf(['row'], 2));
    scope[HEADER] = 'a';
    const parent = document.createElement('div');
    const [a, b] = [parent.appendChild(document.createElement('a')), parent.appendChild(document.createElement('b'))];
    trackNode(a, parent, scope, HEADER + 1);
    trackNode(b, parent, scope, HEADER + 2);
    const removed = new Array<Node>();
    const removeNode = parent.removeChild.bind(parent);
    vi.spyOn(parent, 'removeChild').mockImplementation(<T extends Node>(child: T): T => {
      removed.push(child);
      return removeNode(child);
    });
    const seen = new Array<string>();
    addCleanup(scope, () => seen.push(`cleanup ${parent.childNodes.length}`));
    addCleanup(addChild(scope), () => seen.push(`child ${parent.childNodes.length}`));

    clear(scope);

    expect(removed).toEqual([b, a]);
    expect(seen).toEqual(['cleanup 0', 'child 0']);
    expect(scope.slice(HEADER)).toEqual([null, null, null]);
    expect(scope[PARENT_NODE]).toBeNull();
    expect(scope[CHILDREN]).toBeNull();
  });

  it('leaves a node moved into another node, a node never inserted and an empty slot', () => {
    const scope = _scope(null, layoutOf([], 3));
    const [parent, other] = [document.createElement('div'), document.createElement('div')];
    const moved = parent.appendChild(document.createElement('p'));
    trackNode(moved, parent, scope, HEADER);
    other.appendChild(moved);
    const never = document.createElement('p');
    trackNode(never, parent, scope, HEADER + 1);

    clear(scope);

    expect(moved.parentNode).toBe(other);
    expect(never.parentNode).toBeNull();
  });

  it('leaves the DOM as it is when told not to remove its nodes, running the cleanups and clearing the children', () => {
    const scope = _scope(null, ELEMENT_LAYOUT);
    const parent = document.createElement('div');
    const node = parent.appendChild(document.createElement('p'));
    trackNode(node, parent, scope, HEADER);
    const child = addChild(scope, _scope(scope, ELEMENT_LAYOUT));
    const childNode = parent.appendChild(document.createElement('b'));
    trackNode(childNode, parent, child, HEADER);
    const cleanup = vi.fn();
    addCleanup(child, cleanup);

    clear(scope, false);

    expect(node.parentNode).toBe(parent);
    expect(childNode.parentNode).toBe(parent);
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('removes the nodes of a child beside its own, and leaves the ones of a child inside one of its elements, which go with it', () => {
    const scope = _scope(null, ELEMENT_LAYOUT);
    const parent = document.createElement('div');
    const element = parent.appendChild(document.createElement('ul'));
    trackNode(element, parent, scope, HEADER);
    // A block at the top of the scope, beside its nodes
    const beside = addChild(scope, _scope(scope, ELEMENT_LAYOUT));
    const besideNode = parent.appendChild(document.createElement('p'));
    trackNode(besideNode, parent, beside, HEADER);
    // A block inside the element, holding a block of its own
    const inside = addChild(scope, _scope(scope, ELEMENT_LAYOUT));
    const insideNode = element.appendChild(document.createElement('li'));
    trackNode(insideNode, element, inside, HEADER);
    const nested = addChild(inside, _scope(inside, ELEMENT_LAYOUT));
    const nestedNode = element.appendChild(document.createElement('li'));
    trackNode(nestedNode, element, nested, HEADER);
    const removeNode = vi.spyOn(element, 'removeChild');

    clear(scope);

    expect(element.parentNode).toBeNull();
    expect(besideNode.parentNode).toBeNull();
    expect(insideNode.parentNode).toBe(element);
    expect(nestedNode.parentNode).toBe(element);
    expect(removeNode).not.toHaveBeenCalled();
  });

  it('removes the nodes of the blocks a child tracking no node holds, and the ones of the children of a scope tracking none', () => {
    const scope = _scope(null, ELEMENT_LAYOUT);
    const parent = document.createElement('div');
    trackNode(parent.appendChild(document.createElement('p')), parent, scope, HEADER);
    const block = addChild(addChild(scope), _scope(scope, ELEMENT_LAYOUT));
    const node = parent.appendChild(document.createElement('b'));
    trackNode(node, parent, block, HEADER);
    const empty = _scope(null, EMPTY_LAYOUT);
    const emptyBlock = addChild(empty, _scope(empty, ELEMENT_LAYOUT));
    const emptyNode = parent.appendChild(document.createElement('i'));
    trackNode(emptyNode, parent, emptyBlock, HEADER);

    clear(scope);
    clear(empty);

    expect(node.parentNode).toBeNull();
    expect(emptyNode.parentNode).toBeNull();
  });

  it('removes the element of a component created in code, whose scope has no parent, also when told not to remove its nodes', () => {
    const scope = _scope(null, ELEMENT_LAYOUT);
    const parent = document.createElement('div');
    trackNode(parent.appendChild(document.createElement('p')), parent, scope, HEADER);
    const target = document.createElement('section');
    const created = addChild(scope, _scope(null, ELEMENT_LAYOUT));
    const element = target.appendChild(document.createElement('x-toast'));
    trackNode(element, target, created, HEADER);

    clear(scope, false);

    expect(element.parentNode).toBeNull();
  });

  it('disposes the effects of the bindings, which never run again', async () => {
    const scope = _scope(null, layoutOf(['row']));
    scope[HEADER] = 'a';
    const signal = new Signal.State(1);
    const runs = bindVariables(scope, [HEADER], [0], signal);
    bindVariables(scope, [HEADER], [0]);

    clear(scope);
    signal.set(2);
    await flush();

    expect(runs).toHaveLength(1);
    expect(Signal.subtle.hasSinks(signal)).toBe(false);
  });
});

describe('refresh', () => {
  it('runs again, in the order they were rendered, the bindings reading a variable that changed, and only them', () => {
    const scope = _scope(null, layoutOf(['row', 'index']));
    scope[HEADER] = 'a';
    scope[HEADER + 1] = 0;
    const order = new Array<string>();
    const row = bindVariables(scope, [HEADER], [0]);
    _bindEffect(scope, () => order.push('first'), null, undefined, undefined, [0, 1]);
    const index = bindVariables(scope, [HEADER + 1], [1]);
    addCleanup(scope, vi.fn<() => void>());
    _bindEffect(scope, () => order.push('second'), null, undefined, undefined, [0]);

    update(scope, HEADER, 'b');
    refresh(scope, [0]);

    expect(row).toEqual([['a'], ['b']]);
    expect(index).toEqual([[0]]);
    expect(order).toEqual(['first', 'second', 'first', 'second']);
  });

  it('refreshes the scopes inside the scope, which read its variables, a single binding as many', () => {
    const scope = _scope(null, layoutOf(['row']));
    scope[HEADER] = 'a';
    const nested = addChild(addChild(scope));
    const runs = new Array<unknown>();
    _bindEffect(nested, (context: _Context) => runs.push(_read(context, 2, HEADER)), nested, undefined, undefined, [0]);

    update(scope, HEADER, 'b');
    refresh(scope, [0]);

    expect(runs).toEqual(['a', 'b']);
  });

  it('makes a binding an effect when a run reads a signal, and a plain binding again when a run reads none', async () => {
    const scope = _scope(null, layoutOf(['row']));
    scope[HEADER] = { flagged: false };
    const signal = new Signal.State(1);
    const runs = bindVariables(scope, [HEADER], [0], signal, () => (scope[HEADER] as { flagged: boolean }).flagged);
    expect(Signal.subtle.hasSinks(signal)).toBe(false);

    update(scope, HEADER, { flagged: true });
    refresh(scope, [0]);
    expect(Signal.subtle.hasSinks(signal)).toBe(true);

    signal.set(2);
    await flush();
    expect(runs.map(values => values[1])).toEqual([undefined, 1, 2]);

    update(scope, HEADER, { flagged: false });
    refresh(scope, [0]);
    expect(Signal.subtle.hasSinks(signal)).toBe(false);

    signal.set(3);
    await flush();
    expect(runs).toHaveLength(4);
  });

  it('carries the identifiers of an outer refresh into a refresh run inside it, and never refreshes a scope twice', () => {
    const outer = _scope(null, layoutOf(['row']));
    outer[HEADER] = 'a';
    const inner = addChild(outer, _scope(outer, layoutOf(['cell'])));
    inner[HEADER] = 1;
    const runs = new Array<unknown[]>();
    _bindEffect(inner, (context: _Context) => runs.push([_read(context, 1, HEADER), _read(context, 0, HEADER)]), inner, undefined, undefined, [0, 1]);
    // A binding of the outer scope refreshing the inner one, as a @for reconciling its rows does
    _bindEffect(outer, (scope: _Context) => {
      if (scope[HEADER] === 'b') {
        update(inner, HEADER, 2);
        refresh(inner, [1]);
      }
    }, outer, undefined, undefined, [0]);

    update(outer, HEADER, 'b');
    refresh(outer, [0]);

    expect(runs).toEqual([['a', 1], ['b', 2]]);
  });

  it('does not refresh the scopes created while it runs, which render with the new values', () => {
    const scope = _scope(null, layoutOf(['row']));
    scope[HEADER] = 'a';
    const created = new Array<unknown[]>();
    _bindEffect(scope, (context: _Context) => {
      // A block rendering new content, which reads the variable
      const runs = new Array<unknown>();
      created.push(runs);
      const child = addChild(context);
      _bindEffect(child, (block: _Context) => runs.push(_read(block, 1, HEADER)), child, undefined, undefined, [0]);
    }, scope, undefined, undefined, [0]);

    update(scope, HEADER, 'b');
    refresh(scope, [0]);

    // The child created by the first run is refreshed, the one created by the refresh renders with the new value once
    expect(created).toEqual([['a', 'b'], ['b']]);
  });

  it('carries the identifier of a variable of the scope changed while it runs on to the bindings after it and the scopes inside the scope, not beside it', () => {
    const root = _scope(null, layoutOf(['row']));
    root[HEADER] = 'a';
    const scope = addChild(root, _scope(root, layoutOf(['label'])));
    _declare(scope, HEADER, 'let');
    const beside = addChild(root, _scope(root, layoutOf(['label'])));
    beside[HEADER] = 'beside';
    _bindEffect(scope, (context: _Context) => {
      if (update(context, HEADER, `${_read(context, 1, HEADER)}!`)) {
        propagate(context, 1);
      }
    }, scope, undefined, undefined, [0]);
    const after = bindVariables(scope, [HEADER], [1]);
    const inside = new Array<unknown>();
    const child = addChild(scope);
    _bindEffect(child, (context: _Context) => inside.push(_read(context, 1, HEADER)), child, undefined, undefined, [1]);
    const besides = bindVariables(beside, [HEADER], [1]);

    update(root, HEADER, 'b');
    refresh(root, [0]);

    expect(after).toEqual([['a!'], ['b!']]);
    expect(inside).toEqual(['a!', 'b!']);
    expect(besides).toEqual([['beside']]);
  });

  it('is run by a variable of the scope that changes outside of a refresh, as a @let reading a signal', () => {
    const scope = _scope(null, layoutOf(['total']));
    scope[HEADER] = 1;
    const runs = bindVariables(scope, [HEADER], [0]);

    update(scope, HEADER, 2);
    propagate(scope, 0);

    expect(runs).toEqual([[1], [2]]);
  });

  it('reports the error of a binding in a microtask, keeping it as it was, and runs the other ones', async () => {
    const scope = _scope(null, layoutOf(['row']));
    scope[HEADER] = 'a';
    const signal = new Signal.State(1);
    const failing = vi.fn((context: _Context) => {
      signal.get();
      if (context[HEADER] === 'b') {
        throw new Error('boom');
      }
    });
    _bindEffect(scope, failing, scope, undefined, undefined, [0]);
    const runs = bindVariables(scope, [HEADER], [0]);
    const tasks = new Array<() => void>();
    const queueMicrotask = vi.spyOn(globalThis, 'queueMicrotask').mockImplementation(task => { tasks.push(task); });

    update(scope, HEADER, 'b');
    refresh(scope, [0]);
    queueMicrotask.mockRestore();

    expect(runs).toEqual([['a'], ['b']]);
    expect(tasks).toHaveLength(1);
    expect(() => tasks[0]()).toThrow('boom');
    // The effect of the failing binding still runs when its signal changes
    update(scope, HEADER, 'c');
    signal.set(2);
    await flush();
    expect(failing).toHaveBeenCalledTimes(3);
  });
});

describe('mountNode', () => {
  it('appends the node when no reference node is provided, and tracks it in its slot', () => {
    const parent = document.createElement('div');
    parent.appendChild(document.createElement('span'));
    const scope = _scope(null, ELEMENT_LAYOUT);
    const node = document.createElement('p');

    mountNode(node, parent, scope, undefined, HEADER);

    expect(parent.lastChild).toBe(node);
    expect(scope[HEADER]).toBe(node);
  });

  it('inserts the node before the reference node, tracking nothing without a slot', () => {
    const parent = document.createElement('div');
    const reference = parent.appendChild(document.createElement('span'));
    const scope = _scope(null, ELEMENT_LAYOUT);
    const node = document.createElement('p');

    mountNode(node, parent, scope, reference);

    expect(parent.firstChild).toBe(node);
    expect(nodesOf(scope)).toEqual([]);
  });
});

describe('createAnchor', () => {
  it('mounts a labelled comment, before the reference node or at the end', () => {
    const parent = document.createElement('div');
    const reference = parent.appendChild(document.createElement('span'));
    const scope = _scope(null, layoutOf([], 2));

    const first = createAnchor('if', parent, scope, reference, HEADER);
    const last = createAnchor('for', parent, scope);

    expect(first).toBeInstanceOf(Comment);
    expect(first.data).toBe('if');
    expect(parent.firstChild).toBe(first);
    expect(parent.lastChild).toBe(last);
    expect(nodesOf(scope)).toEqual([first]);
  });
});
