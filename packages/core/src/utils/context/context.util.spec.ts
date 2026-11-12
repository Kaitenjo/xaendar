// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { CLEANUP, COMPONENT, CONTAINER_SLOTS, HEADER, KEYS, LAYOUT, PARENT, PARENT_NODE, POSITION } from '../../costants';
import { _bindEffect, _bindSite } from '../../signals/effect/effect';
import type { BindingSite } from '../../types/binding-site.type';
import type { _Context } from '../../types/context.type';
import type { Branch } from '../../types/if/branch.type';
import type { InlineBranch } from '../../types/inline-branch.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { _ScopeLayout } from '../../types/scope-layout.type';
import { CREATE_NODES } from '../create-nodes/create-nodes.util';
import { closeTryScope, openTryScope } from '../try-scope/try-scope.util';
import { _declare, _read, _scope, _set, addCleanup, bindingsBase, clear, clearInline, containerSlot, createAnchor, ELEMENT_LAYOUT, EMPTY_LAYOUT, forEachChild, forEachInline, getNodeStrategy, moveTo, mountNode, nodesEnd, propagate, refresh, removeCleanup, renderInline, setNodeStrategy, STRUCTURAL_LAYOUT, swapNodeStrategy, trackNode, update } from './context.util';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * The layout of a scope declaring the variables named, followed by some nodes and some containers.
 */
function layoutOf(variables: string[], nodes = 0, containers = 0): _ScopeLayout {
  const layout = { size: HEADER + variables.length + nodes + CONTAINER_SLOTS * containers, nodes: HEADER + variables.length, variables };
  return containers ? { ...layout, containers: layout.nodes + nodes } : layout;
}

/**
 * The layout of a scope holding blocks, and no variable nor node.
 */
const HOLDER = layoutOf([], 0, 3);

/**
 * The layout of a scope holding a node, then blocks.
 */
const ELEMENT_HOLDER = layoutOf([], 1, 3);

/**
 * Holds a scope in the first empty container of another one, as a block does: a scope holding blocks when none is given.
 */
function addChild(scope: _Context, child: _Context = _scope(scope, HOLDER)): _Context {
  let slot = containerSlot(scope);
  while (scope[slot]) {
    slot += CONTAINER_SLOTS;
  }

  scope[slot] = child;
  return child;
}

/**
 * The scopes the containers of a scope hold, in order.
 */
function childrenOf(scope: _Context): _Context[] {
  const children = new Array<_Context>();
  forEachChild(scope, (child, list) => list.push(child), children);
  return children;
}

/**
 * The nodes a scope tracks, in the order of their slots.
 */
const nodesOf = (scope: _Context): unknown[] => scope.slice(scope[LAYOUT].nodes, nodesEnd(scope)).filter(Boolean);

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
  it('creates an array of the size of its layout, its header holding the parent, the node of its nodes, the component, the cleanups and the layout', () => {
    const layout = layoutOf(['row'], 2);
    const scope = _scope(null, layout);

    expect(HEADER).toBe(5);
    expect(scope).toHaveLength(HEADER + 3);
    expect(scope[PARENT]).toBeNull();
    expect(scope[PARENT_NODE]).toBeNull();
    expect(scope[COMPONENT]).toBeUndefined();
    expect(scope[CLEANUP]).toBeNull();
    expect(scope[LAYOUT]).toBe(layout);
    expect(scope.slice(HEADER)).toEqual([undefined, undefined, undefined]);
  });

  it('gives the root of a render the component it renders, which the scopes it holds inherit', () => {
    const component = {};
    const root = _scope(null, EMPTY_LAYOUT, CREATE_NODES, component);

    expect(root[COMPONENT]).toBe(component);
    expect(_scope(root, EMPTY_LAYOUT)[COMPONENT]).toBe(component);
  });

  it('keeps the strategy of a hydration outside of the scope, inherited by the scopes created in it, until it is the one creating the nodes', () => {
    const strategy = { name: 'claim' } as unknown as NodeStrategy;
    const parent = _scope(null, EMPTY_LAYOUT, strategy);
    const inherited = _scope(parent, EMPTY_LAYOUT);
    const creating = _scope(parent, EMPTY_LAYOUT, CREATE_NODES);

    expect(parent).toHaveLength(HEADER);
    expect(getNodeStrategy(parent)).toBe(strategy);
    expect(getNodeStrategy(inherited)).toBe(strategy);
    expect(getNodeStrategy(creating)).toBe(CREATE_NODES);
    expect(getNodeStrategy(_scope(creating, EMPTY_LAYOUT))).toBe(CREATE_NODES);

    // Once every scope creates its nodes again, none is looked up
    setNodeStrategy(parent, CREATE_NODES);
    clear(inherited);
    expect(getNodeStrategy(parent)).toBe(CREATE_NODES);
    expect(getNodeStrategy(_scope(parent, EMPTY_LAYOUT))).toBe(CREATE_NODES);
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

describe('containers', () => {
  it('gives the slot of a container, the first one by default, after the nodes, where the nodes end', () => {
    const scope = _scope(null, layoutOf(['row'], 2, 3));

    expect(containerSlot(scope)).toBe(HEADER + 3);
    expect(containerSlot(scope, 2)).toBe(HEADER + 3 + 2 * CONTAINER_SLOTS);
    expect(nodesEnd(scope)).toBe(HEADER + 3);
    expect(nodesEnd(_scope(null, layoutOf([], 2)))).toBe(HEADER + 2);
    expect(STRUCTURAL_LAYOUT).toEqual({ size: HEADER + 1 + CONTAINER_SLOTS, nodes: HEADER, containers: HEADER + 1 });
  });

  it('visits the scopes its containers hold in order, the rows of a @for in theirs, and skips the empty ones', () => {
    const root = _scope(null, layoutOf([], 0, 4));
    const [first, second, third] = [_scope(root, EMPTY_LAYOUT), _scope(root, EMPTY_LAYOUT), _scope(root, EMPTY_LAYOUT)];
    root[containerSlot(root)] = first;
    root[containerSlot(root, 1)] = null;
    // The rows of a @for, its keys beside them, and a @for not run yet
    root[containerSlot(root, 2)] = [second, third];
    root[containerSlot(root, 2) + KEYS] = ['b', 'c'];
    root[containerSlot(root, 3) + POSITION] = document.createComment('for');

    expect(childrenOf(root)).toEqual([first, second, third]);
    expect(childrenOf(_scope(null, EMPTY_LAYOUT))).toEqual([]);
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
  it('sets the strategy of the scope and of the scopes it holds, in its containers and in its cleanups, leaving the ones holding it', () => {
    const strategy = { name: 'claim' } as unknown as NodeStrategy;
    const root = _scope(null, HOLDER, strategy);
    const scope = addChild(root);
    const nested = addChild(addChild(scope));
    const held = _scope(scope, EMPTY_LAYOUT);
    addCleanup(scope, vi.fn<() => void>());
    addCleanup(scope, { scope: held });
    const single = _scope(null, EMPTY_LAYOUT, strategy);
    const heldAlone = _scope(single, EMPTY_LAYOUT);
    addCleanup(single, { scope: heldAlone });

    setNodeStrategy(scope, CREATE_NODES);
    setNodeStrategy(single, CREATE_NODES);

    expect(getNodeStrategy(root)).toBe(strategy);
    expect([scope, nested, held, heldAlone].map(getNodeStrategy)).toEqual([CREATE_NODES, CREATE_NODES, CREATE_NODES, CREATE_NODES]);
    setNodeStrategy(root, CREATE_NODES);
  });

  it('swaps the strategy of the scope alone', () => {
    const strategy = { name: 'claim' } as unknown as NodeStrategy;
    const scope = _scope(null, HOLDER);
    const child = addChild(scope);

    swapNodeStrategy(scope, strategy);

    expect(getNodeStrategy(scope)).toBe(strategy);
    expect(getNodeStrategy(child)).toBe(CREATE_NODES);
    swapNodeStrategy(scope, CREATE_NODES);
    expect(getNodeStrategy(scope)).toBe(CREATE_NODES);
  });
});

describe('moveTo', () => {
  it('moves the cleanups, the scopes they hold included, to another scope, leaving it empty', () => {
    const [staging, target] = [_scope(null, EMPTY_LAYOUT), _scope(null, EMPTY_LAYOUT)];
    const [first, second] = [vi.fn<() => void>(), vi.fn<() => void>()];
    addCleanup(staging, first);
    addCleanup(staging, second);
    const held = { scope: _scope(null, EMPTY_LAYOUT) };
    addCleanup(staging, held);

    moveTo(staging, target);

    expect(staging[CLEANUP]).toBeNull();
    expect(target[CLEANUP]).toEqual([first, second, held]);
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
    const scope = _scope(null, layoutOf(['row'], 2, 1));
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
    expect(scope.slice(HEADER)).toEqual([null, null, null, null, null, null]);
    expect(scope[PARENT_NODE]).toBeNull();
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
    const scope = _scope(null, ELEMENT_HOLDER);
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
    const scope = _scope(null, ELEMENT_HOLDER);
    const parent = document.createElement('div');
    const element = parent.appendChild(document.createElement('ul'));
    trackNode(element, parent, scope, HEADER);
    // A block at the top of the scope, beside its nodes
    const beside = addChild(scope, _scope(scope, ELEMENT_LAYOUT));
    const besideNode = parent.appendChild(document.createElement('p'));
    trackNode(besideNode, parent, beside, HEADER);
    // A block inside the element, holding a block of its own
    const inside = addChild(scope, _scope(scope, ELEMENT_HOLDER));
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
    const scope = _scope(null, ELEMENT_HOLDER);
    const parent = document.createElement('div');
    trackNode(parent.appendChild(document.createElement('p')), parent, scope, HEADER);
    const block = addChild(addChild(scope), _scope(scope, ELEMENT_LAYOUT));
    const node = parent.appendChild(document.createElement('b'));
    trackNode(node, parent, block, HEADER);
    const empty = _scope(null, HOLDER);
    const emptyBlock = addChild(empty, _scope(empty, ELEMENT_LAYOUT));
    const emptyNode = parent.appendChild(document.createElement('i'));
    trackNode(emptyNode, parent, emptyBlock, HEADER);

    clear(scope);
    clear(empty);

    expect(node.parentNode).toBeNull();
    expect(emptyNode.parentNode).toBeNull();
  });

  it('clears the scopes its cleanups hold, removing their nodes, as the element of a component created in code, also when told not to remove its own', () => {
    const scope = _scope(null, ELEMENT_LAYOUT);
    const parent = document.createElement('div');
    trackNode(parent.appendChild(document.createElement('p')), parent, scope, HEADER);
    const target = document.createElement('section');
    const created = _scope(null, ELEMENT_LAYOUT);
    addCleanup(scope, { scope: created });
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
    const scope = _scope(null, layoutOf(['row'], 0, 1));
    scope[HEADER] = 'a';
    const nested = addChild(addChild(scope));
    const runs = new Array<unknown>();
    _bindEffect(nested, (context: _Context) => runs.push(_read(context, 2, HEADER)), nested, undefined, undefined, [0]);

    update(scope, HEADER, 'b');
    refresh(scope, [0]);

    expect(runs).toEqual(['a', 'b']);
  });

  it('refreshes the scopes its cleanups hold, as the branch of a conditional binding, after the bindings before them', () => {
    const scope = _scope(null, layoutOf(['row']));
    scope[HEADER] = 'a';
    const order = new Array<string>();
    _bindEffect(scope, () => order.push('selection'), null, undefined, undefined, [0]);
    const branch = _scope(scope, EMPTY_LAYOUT);
    addCleanup(scope, { scope: branch });
    _bindEffect(branch, (context: _Context) => order.push(`branch ${_read(context, 1, HEADER)}`), branch, undefined, undefined, [0]);

    update(scope, HEADER, 'b');
    refresh(scope, [0]);

    expect(order).toEqual(['selection', 'branch a', 'selection', 'branch b']);
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
    const outer = _scope(null, layoutOf(['row'], 0, 1));
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
    const scope = _scope(null, layoutOf(['row'], 0, 2));
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
    const root = _scope(null, layoutOf(['row'], 0, 2));
    root[HEADER] = 'a';
    const scope = addChild(root, _scope(root, layoutOf(['label'], 0, 1)));
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

describe('bindings in the slots of the scope', () => {
  /**
   * The layout of a scope declaring a variable, holding a node, then the slots of the bindings given, as the compiler
   * writes it.
   */
  const siteLayout = (sites: BindingSite[], slots: number): _ScopeLayout => ({ size: HEADER + 2 + slots, nodes: HEADER + 1, bindings: HEADER + 2, sites, variables: ['row'] });

  /**
   * A binding writing the variable of the scope and the signal it reads, if any, into its target, an array.
   */
  const write = vi.fn((scope: _Context, target: unknown[], site: BindingSite & { signal?: Signal.State<number> }) => {
    target.push(site.signal ? [scope[HEADER], site.signal.get()] : scope[HEADER]);
  });

  it('keeps in its slots the effect of a binding, null while it reads no signal, and the target of a binding reading variables', async () => {
    const signal = new Signal.State(1);
    const reading: BindingSite = { update: write, reads: [0], effect: 0, target: 1 };
    const watching: BindingSite & { signal: Signal.State<number> } = { update: write, signal, effect: 2 };
    const scope = _scope(null, siteLayout([reading, watching], 3));
    scope[HEADER] = 'a';
    const first = new Array<unknown>();
    const second = new Array<unknown>();

    _bindSite(scope, reading, first);
    _bindSite(scope, watching, second);
    expect(nodesEnd(scope)).toBe(HEADER + 2);
    expect(scope.slice(HEADER + 2)).toEqual([null, first, expect.objectContaining({ dispose: expect.any(Function) })]);
    expect(scope[CLEANUP]).toBeNull();

    signal.set(2);
    await flush();
    expect(second).toEqual([['a', 1], ['a', 2]]);
  });

  it('runs again with its target, before the cleanups, a binding reading a variable changed, its effect taking the place of the previous one', async () => {
    const signal = new Signal.State(1);
    const site: BindingSite & { signal?: Signal.State<number> } = { update: write, reads: [0], effect: 0, target: 1 };
    const scope = _scope(null, siteLayout([site], 2));
    scope[HEADER] = 'a';
    const target = new Array<unknown>();
    const order = new Array<unknown>();
    _bindSite(scope, site, target);
    _bindEffect(scope, () => order.push(target.length), null, undefined, undefined, [0]);

    // The new run reads a signal: it becomes an effect, the binding running again when the signal changes
    Object.assign(site, { signal });
    update(scope, HEADER, 'b');
    refresh(scope, [0]);
    expect(target).toEqual(['a', ['b', 1]]);
    expect(order).toEqual([1, 2]);

    signal.set(2);
    await flush();
    expect(target).toEqual(['a', ['b', 1], ['b', 2]]);

    delete site.signal;
    update(scope, HEADER, 'c');
    refresh(scope, [0]);
    expect(scope[HEADER + 2]).toBeNull();
    expect(Signal.subtle.hasSinks(signal)).toBe(false);
  });

  it('passes over a binding of its layout not bound yet, and over the ones reading no variable changed', () => {
    const update = vi.fn();
    const pending: BindingSite = { update, reads: [0], effect: 0, target: 1 };
    const other: BindingSite = { update, reads: [1], effect: 2, target: 3 };
    const scope = _scope(null, siteLayout([pending, other], 4));
    _bindSite(scope, other, null);
    update.mockClear();

    refresh(scope, [0]);

    expect(update).not.toHaveBeenCalled();
  });

  it('reports the error of a binding in its slots in a microtask, keeping its effect', async () => {
    const signal = new Signal.State(1);
    const failing = vi.fn((scope: _Context) => {
      signal.get();
      if (scope[HEADER] === 'b') {
        throw new Error('boom');
      }
    });
    const site: BindingSite = { update: failing, reads: [0], effect: 0, target: 1 };
    const scope = _scope(null, siteLayout([site], 2));
    scope[HEADER] = 'a';
    _bindSite(scope, site, null);
    const effect = scope[HEADER + 2];
    const tasks = new Array<() => void>();
    const queueMicrotask = vi.spyOn(globalThis, 'queueMicrotask').mockImplementation(task => { tasks.push(task); });

    update(scope, HEADER, 'b');
    refresh(scope, [0]);
    queueMicrotask.mockRestore();

    expect(() => tasks[0]()).toThrow('boom');
    expect(scope[HEADER + 2]).toBe(effect);
  });

  it('disposes the effects of its bindings when it is cleared', async () => {
    const signal = new Signal.State(1);
    const site: BindingSite & { signal: Signal.State<number> } = { update: write, signal, effect: 0 };
    const scope = _scope(null, siteLayout([site], 1));
    const target = new Array<unknown>();
    _bindSite(scope, site, target);

    clear(scope);
    signal.set(2);
    await flush();

    expect(target).toHaveLength(1);
    expect(Signal.subtle.hasSinks(signal)).toBe(false);
  });

  it('keeps among the cleanups a binding without slots, rendered in a scope the runtime creates', () => {
    const update = vi.fn();
    const scope = _scope(null, layoutOf(['row']));
    _bindSite(scope, { reads: [0] }, 'target', update);
    expect(update).toHaveBeenCalledWith(scope, 'target', { reads: [0] });

    refresh(scope, [0]);
    expect(update).toHaveBeenCalledTimes(2);
  });
});

describe('branches rendered inline', () => {
  /**
   * A scope holding a node, then the area of a block, of four slots, then its container.
   */
  const AREA_LAYOUT: _ScopeLayout = { size: HEADER + 5 + CONTAINER_SLOTS, nodes: HEADER, bindings: HEADER + 1, sites: [], containers: HEADER + 5 };

  /**
   * A branch filling the area: a node in its first slot, a binding in the second one and its cleanups in the fourth.
   */
  function branchOf(block: Branch['block'], site: BindingSite = { update: vi.fn(), reads: [0], effect: 1, target: 2 }): Branch & InlineBranch {
    return { block, base: HEADER + 1, size: 4, nodes: [0], sites: [site], cleanup: 3 };
  }

  it('keeps in the slots of the branch its nodes, its bindings and its cleanups while it renders, its nodes got with its strategy', () => {
    const scope = _scope(null, AREA_LAYOUT);
    const parent = document.createElement('div');
    const own = parent.appendChild(document.createElement('p'));
    trackNode(own, parent, scope, HEADER);
    const strategy = { ...CREATE_NODES };
    const swapped = { ...CREATE_NODES };
    const seen = new Array<unknown>();
    const listener = vi.fn();
    const branch = branchOf((parentNode, context) => {
      const node = document.createElement('b');
      mountNode(node, parentNode, context, null, 0);
      _bindSite(context, branch.sites![0], node);
      addCleanup(context, listener);
      seen.push(getNodeStrategy(context), bindingsBase(context));
      swapNodeStrategy(context, swapped);
      seen.push(getNodeStrategy(context));
      return undefined;
    });

    renderInline(scope, branch, parent, null, strategy);

    expect(seen).toEqual([strategy, HEADER + 1, swapped]);
    expect(scope.slice(HEADER + 1, HEADER + 5)).toEqual([parent.lastChild, null, parent.lastChild, listener]);
    // Once it is rendered, the scope gets its nodes, its bindings and its cleanups again
    expect(getNodeStrategy(scope)).toBe(CREATE_NODES);
    expect(bindingsBase(scope)).toBe(HEADER + 1);
    expect(scope[PARENT_NODE]).toBe(parent);
    expect(scope[CLEANUP]).toBeNull();
  });

  it('gets the scope back when the branch throws', () => {
    const scope = _scope(null, AREA_LAYOUT);
    const branch = branchOf(() => {
      throw new Error('boom');
    });

    expect(() => renderInline(scope, branch, document.createElement('div'), null, CREATE_NODES)).toThrow('boom');
    addCleanup(scope, vi.fn<() => void>());
    expect(scope[CLEANUP]).not.toBeNull();
  });

  it('empties its slots as clear empties a scope: its nodes from the last to the first, its effects, then its cleanups', async () => {
    const scope = _scope(null, AREA_LAYOUT);
    const parent = document.createElement('div');
    const signal = new Signal.State(1);
    const order = new Array<string>();
    const site: BindingSite = { update: () => order.push(`run ${signal.get()}`), effect: 1 };
    const branch: Branch & InlineBranch = {
      block: (parentNode, context) => {
        mountNode(document.createElement('a'), parentNode, context, null, 0);
        mountNode(document.createElement('b'), parentNode, context, null, 2);
        _bindSite(context, site);
        addCleanup(context, () => order.push(`cleanup ${parent.childNodes.length}`));
        addCleanup(context, () => order.push('second cleanup'));
        return undefined;
      },
      base: HEADER + 1, size: 4, nodes: [0, 2], sites: [site], cleanup: 3
    };
    renderInline(scope, branch, parent, null, CREATE_NODES);
    const removed = vi.spyOn(parent, 'removeChild');

    clearInline(scope, branch, true, parent);
    signal.set(2);
    await flush();

    expect(removed.mock.calls.map(([node]) => (node as Element).localName)).toEqual(['b', 'a']);
    expect(order).toEqual(['run 1', 'cleanup 0', 'second cleanup']);
    expect(scope.slice(HEADER + 1, HEADER + 5)).toEqual([undefined, undefined, undefined, undefined]);
  });

  it('removes the nodes of the branch only from the node they are inserted into, from any node when told none, and keeps them when told not to remove them', () => {
    const scope = _scope(null, AREA_LAYOUT);
    const parent = document.createElement('div');
    const elsewhere = document.createElement('section');
    const render = (parentNode: HTMLElement, context: _Context): undefined => {
      mountNode(document.createElement('a'), parentNode, context, null, 0);
      return undefined;
    };
    const branch: Branch & InlineBranch = { block: render, base: HEADER + 1, size: 1, nodes: [0] };

    renderInline(scope, branch, parent, null, CREATE_NODES);
    clearInline(scope, branch, true, elsewhere);
    expect(parent.childNodes).toHaveLength(1);

    renderInline(scope, branch, parent, null, CREATE_NODES);
    clearInline(scope, branch, false, null);
    expect(parent.childNodes).toHaveLength(2);

    renderInline(scope, branch, parent, null, CREATE_NODES);
    clearInline(scope, branch, true, null);
    expect(parent.childNodes).toHaveLength(2);
  });

  it('is visited, refreshed and emptied with the scope holding its block, its nodes removed when they are beside the ones of the scope', () => {
    const scope = _scope(null, { ...AREA_LAYOUT, variables: ['row'], size: HEADER + 6 + CONTAINER_SLOTS, nodes: HEADER + 1, bindings: HEADER + 2, containers: HEADER + 6 });
    scope[HEADER] = 'a';
    const parent = document.createElement('div');
    trackNode(parent.appendChild(document.createElement('p')), parent, scope, HEADER + 1);
    const runs = new Array<unknown>();
    const site: BindingSite = { update: (context: _Context) => runs.push(context[HEADER]), reads: [0], effect: 1, target: 2 };
    const branch: Branch & InlineBranch = {
      block: (parentNode, context) => {
        mountNode(document.createElement('b'), parentNode, context, null, 0);
        _bindSite(context, site, null);
        return undefined;
      },
      base: HEADER + 2, size: 3, nodes: [0], sites: [site]
    };
    renderInline(scope, branch, parent, null, CREATE_NODES);
    scope[containerSlot(scope)] = branch;
    const visited = new Array<unknown>();
    forEachInline(scope, (context, inline, argument) => visited.push(context, inline, argument), 'argument');
    forEachInline(_scope(null, EMPTY_LAYOUT), () => visited.push('none'), undefined);

    update(scope, HEADER, 'b');
    refresh(scope, [0]);
    clear(scope);

    expect(visited).toEqual([scope, branch, 'argument']);
    expect(runs).toEqual(['a', 'b']);
    expect(parent.childNodes).toHaveLength(0);
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
