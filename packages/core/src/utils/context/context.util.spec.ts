// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { NodeStrategy } from '../../types/node-strategy.type';
import { _bindEffect } from '../../signals/effect/effect';
import { closeTryScope, openTryScope } from '../try-scope/try-scope.util';
import { _Context, createAnchor, mountNode } from './context.util';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Registers a binding of a context reading some of its variables, as a template does: it records the values of the
 * variables at each run, and reads the signal, if any, while `readsSignal` holds.
 */
function bindVariables(context: _Context, reads: string[], signal?: Signal.State<number>, readsSignal: () => boolean = () => true): unknown[][] {
  const runs = new Array<unknown[]>();
  _bindEffect(context, (scope: _Context) => {
    const values = reads.map(name => scope.get(name));
    if (signal && readsSignal()) {
      values.push(signal.get());
    }
    runs.push(values);
  }, context, undefined, undefined, reads);
  return runs;
}

function createRoot(): _Context {
  const parent = {
    createElement: (tagName: string) => document.createElement(tagName),
    get: () => undefined
  } as unknown as _Context;
  return new _Context(parent);
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

  describe('storage of the variables', () => {
    /**
     * The storage of the variables of a context: the array alternating names and values, the Map, or null.
     */
    const variablesOf = (context: _Context) => (context as unknown as { _variables: unknown[] | Map<string, unknown> | null })._variables;

    /**
     * The names from `v0` to `v{count - 1}`.
     */
    const names = (count: number) => Array.from({ length: count }, (_, i) => `v${i}`);

    it('keeps nothing for a scope declaring no variable', () => {
      expect(variablesOf(createRoot())).toBeNull();
    });

    it('keeps the variables of a scope declaring up to 16 of them in an array of that size, filled in order', () => {
      const context = new _Context(createRoot(), undefined, 3);
      expect(variablesOf(context)).toHaveLength(6);

      context.addIdentifier('a', 1);
      context.declare('b');
      expect(variablesOf(context)).toEqual(['a', 1, 'b', expect.any(Symbol), undefined, undefined]);

      context.set('b', 2);
      context.addIdentifier('c', 3);
      expect(variablesOf(context)).toEqual(['a', 1, 'b', 2, 'c', 3]);
      expect([context.get('a'), context.get('b'), context.get('c')]).toEqual([1, 2, 3]);
      expect(() => context.addIdentifier('a', 4)).toThrow('Identifier "a" is already declared in this scope.');
      expect(variablesOf(new _Context(createRoot(), undefined, 16))).toHaveLength(32);
    });

    it('keeps the variables of a scope declaring more than 16 of them in a Map', () => {
      const context = new _Context(createRoot(), undefined, 17);
      expect(variablesOf(context)).toBeInstanceOf(Map);

      const all = names(17);
      for (let i = 0; i < all.length; i++) {
        context.addIdentifier(all[i], i);
      }

      context.declare('ref');
      expect(() => context.get('ref')).toThrow(ReferenceError);
      context.set('ref', 'element');
      expect([context.get('v0'), context.get('v16'), context.get('ref'), context.get('unknown')]).toEqual([0, 16, 'element', undefined]);
      expect(() => context.addIdentifier('v3', 0)).toThrow('Identifier "v3" is already declared in this scope.');

      context.removeIdentifier('v3');
      expect(context.get('v3')).toBeUndefined();
    });

    it('grows the array of a scope created without the number of its variables by one variable at a time, and moves them to a Map beyond 16', () => {
      const context = createRoot();
      const all = names(17);
      context.addIdentifier(all[0], 0);
      expect(variablesOf(context)).toEqual(['v0', 0]);

      for (let i = 1; i < 16; i++) {
        context.addIdentifier(all[i], i);
      }
      expect(variablesOf(context)).toHaveLength(32);

      context.addIdentifier(all[16], 16);
      expect(variablesOf(context)).toBeInstanceOf(Map);
      expect(all.map(name => context.get(name))).toEqual(all.map((_, i) => i));
    });

    it('grows a full array by one variable, without spreading a value which is an array', () => {
      const context = new _Context(createRoot(), undefined, 1);
      context.addIdentifier('first', 1);
      context.addIdentifier('list', [2, 3]);

      expect(variablesOf(context)).toEqual(['first', 1, 'list', [2, 3]]);
    });

    it('frees the slot of a variable removed, which the next variable takes, and leaves the free slots out of a Map', () => {
      const context = new _Context(createRoot(), undefined, 2);
      context.addIdentifier('a', 1);
      context.addIdentifier('b', 2);
      context.removeIdentifier('a');
      context.removeIdentifier('missing');
      expect(variablesOf(context)).toEqual([undefined, undefined, 'b', 2]);
      expect(context.get('a')).toBeUndefined();

      context.addIdentifier('c', 3);
      expect(variablesOf(context)).toEqual(['c', 3, 'b', 2]);

      const empty = createRoot();
      empty.removeIdentifier('a');
      expect(variablesOf(empty)).toBeNull();

      const full = new _Context(createRoot(), undefined, 16);
      const all = names(16);
      for (let i = 0; i < all.length; i++) {
        full.addIdentifier(all[i], i);
      }
      // 'x' takes the slot of v0, 'y' finds the array full
      full.removeIdentifier('v0');
      full.addIdentifier('x', 'x');
      full.addIdentifier('y', 'y');
      expect([...(variablesOf(full) as Map<string, unknown>).keys()]).toEqual(['x', ...names(16).slice(1), 'y']);
    });

    it('initializes a variable of an ancestor scope, through a scope keeping its own in an array or in a Map', () => {
      const root = new _Context(createRoot(), undefined, 1);
      root.declare('field');
      const arrayScope = new _Context(root, undefined, 1);
      arrayScope.addIdentifier('own', 1);
      const mapScope = new _Context(arrayScope, undefined, 17);

      mapScope.set('field', 'element');
      expect(root.get('field')).toBe('element');
    });

    it('drops its variables when cleared', () => {
      const context = new _Context(createRoot(), undefined, 2);
      context.addIdentifier('a', 1);
      context.clear();

      expect(variablesOf(context)).toBeNull();
    });
  });

  describe('declared variables', () => {
    it('throws when a variable declared without a value is read before it is initialized, instead of reading an outer one named like it', () => {
      const root = createRoot();
      root.addIdentifier('field', 'outer');
      const scope = root.addChild();
      scope.declare('field');

      expect(() => scope.addChild().get('field')).toThrow(new ReferenceError('Element ref "field" is read before the element it names is rendered'));
    });

    it('throws when a @let is read before it is initialized', () => {
      const scope = createRoot();
      scope.declare('total', 'let');

      expect(() => scope.get('total')).toThrow(new ReferenceError('@let "total" is read before its declaration is rendered'));
      scope.set('total', 3);
      expect(scope.get('total')).toBe(3);
    });

    it('initializes the variable in the scope declaring it, from that scope or from a nested one', () => {
      const scope = createRoot();
      scope.declare('form');
      scope.declare('field');
      const children = scope.addChild();

      scope.set('form', 'the form');
      children.addChild().set('field', 'the field');

      expect(children.get('form')).toBe('the form');
      expect(scope.get('field')).toBe('the field');
      expect(children.getChildren()![0].get('field')).toBe('the field');
    });

    it('throws when a variable is declared twice in the same scope', () => {
      const scope = createRoot();
      scope.declare('field');
      expect(() => scope.declare('field')).toThrow('Identifier "field" is already declared in this scope.');
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
      const spies = [a, b, c, d].map(child => vi.spyOn(child, 'clear'));

      root.removeChild(a);
      root.removeChild(c);
      root.removeChild(d);
      root.clear();

      expect(spies.map(spy => spy.mock.calls.length)).toEqual([0, 1, 0, 0]);
    });
  });

  describe('removeChild', () => {
    it('ignores a context that is not a child', () => {
      const root = createRoot();
      const child = root.addChild();
      const childClear = vi.spyOn(child, 'clear');

      root.removeChild(createRoot());
      root.clear();

      expect(childClear).toHaveBeenCalledOnce();
    });

    it('ignores any context when it holds no child', () => {
      const root = createRoot();

      root.removeChild(createRoot());

      expect(root.getChildren()).toBeNull();
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

    it('ignores a node it does not track', () => {
      const context = createRoot();
      const a = document.createElement('a');
      context.removeNode(a);
      expect(context.getNodes()).toBeNull();

      context.addNode(a);
      context.removeNode(document.createElement('b'));
      expect(context.getNodes()).toEqual([a]);
    });

    it('keeps the node each node is inserted into at the index of the node when one is removed', () => {
      const context = createRoot();
      const [first, second, third] = [document.createElement('div'), document.createElement('div'), document.createElement('div')];
      const [a, b, c] = [first.appendChild(document.createElement('a')), second.appendChild(document.createElement('b')), third.appendChild(document.createElement('i'))];
      context.addNode(a, first);
      context.addNode(b, second);
      context.addNode(c, third);

      context.removeNode(b);
      context.clear();

      expect(a.parentNode).toBeNull();
      expect(b.parentNode).toBe(second);
      expect(c.parentNode).toBeNull();
    });
  });

  describe('addUnlistener', () => {
    it('disposes on clear an object registered with its dispose method, as an effect, in registration order', () => {
      const root = createRoot();
      const order = new Array<string>();
      const disposable = { dispose: vi.fn(() => order.push('dispose')) };
      root.addUnlistener(() => order.push('first'), disposable, () => order.push('last'));

      root.clear();

      expect(order).toEqual(['first', 'dispose', 'last']);
      expect(disposable.dispose).toHaveBeenCalledOnce();
    });

    it('adds the cleanups registered later to the ones registered before', () => {
      const root = createRoot();
      const [first, second] = [vi.fn(), vi.fn()];
      root.addUnlistener(first);
      root.addUnlistener(second);

      expect(root.getUnlistenFns()).toEqual([first, second]);
    });
  });

  describe('removeUnlistener', () => {
    it('does not run the removed cleanups on clear, but keeps the others', () => {
      const root = createRoot();
      const [first, second, third] = [vi.fn(), vi.fn(), vi.fn()];
      root.addUnlistener(first, second, third);

      root.removeUnlistener(first, third);
      root.removeUnlistener(vi.fn<() => void>());
      root.clear();

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledOnce();
      expect(third).not.toHaveBeenCalled();
    });

    it('does nothing for a context without cleanups', () => {
      const root = createRoot();

      root.removeUnlistener(vi.fn<() => void>());

      expect(root.getUnlistenFns()).toBeNull();
    });
  });

  describe('clear', () => {
    it('runs the registered cleanups, destroys the children and clears the state', () => {
      const root = createRoot();
      const child = root.addChild();
      const childClear = vi.spyOn(child, 'clear');
      const first = vi.fn();
      const second = vi.fn();
      root.addUnlistener(first, second);
      root.addIdentifier('name', 1);
      root.addNode(document.createElement('div'));

      root.clear();

      expect(first).toHaveBeenCalledOnce();
      expect(second).toHaveBeenCalledOnce();
      expect(childClear).toHaveBeenCalledOnce();
      expect(root.getNodes()).toBeNull();
      expect(root.get('name')).toBeUndefined();

      root.clear();
      expect(first).toHaveBeenCalledOnce();
      expect(childClear).toHaveBeenCalledOnce();
    });

    it('removes each node from the node it is inserted into, from the last to the first, before running the cleanups and destroying the children', () => {
      const root = createRoot();
      const parent = document.createElement('div');
      const [a, b] = [parent.appendChild(document.createElement('a')), parent.appendChild(document.createElement('b'))];
      root.addNode(a, parent);
      root.addNode(b, parent);
      const removed = new Array<Node>();
      const removeChild = parent.removeChild.bind(parent);
      vi.spyOn(parent, 'removeChild').mockImplementation(<T extends Node>(child: T): T => {
        removed.push(child);
        return removeChild(child);
      });
      const seen = new Array<string>();
      root.addUnlistener(() => seen.push(`cleanup ${parent.childNodes.length}`));
      vi.spyOn(root.addChild(), 'clear').mockImplementation(() => seen.push(`child ${parent.childNodes.length}`));

      root.clear();

      expect(removed).toEqual([b, a]);
      expect(seen).toEqual(['cleanup 0', 'child 0']);
    });

    it('leaves a node moved into another node', () => {
      const root = createRoot();
      const [parent, other] = [document.createElement('div'), document.createElement('div')];
      const node = parent.appendChild(document.createElement('p'));
      root.addNode(node, parent);
      other.appendChild(node);

      root.clear();

      expect(node.parentNode).toBe(other);
    });

    it('ignores a node never inserted', () => {
      const root = createRoot();
      const node = document.createElement('p');
      root.addNode(node, document.createElement('div'));

      root.clear();

      expect(node.parentNode).toBeNull();
    });

    it('leaves a node tracked without the node it is inserted into, as the nodes of the server a @hydrate holds', () => {
      const root = createRoot();
      const parent = document.createElement('div');
      const node = parent.appendChild(document.createElement('p'));
      root.addNode(node);

      root.clear();

      expect(node.parentNode).toBe(parent);
    });
  });

  describe('constructor', () => {
    it('is collected by the @try rendering its content, and by no other', () => {
      const root = createRoot();
      const scope = openTryScope();
      const child = root.addChild();
      closeTryScope(scope);
      root.addChild();

      expect(scope.contexts).toEqual([child]);
    });

    it('gives the root context of a render the component it renders, which the contexts it holds inherit', () => {
      const component = { name: 'component' };
      const root = new _Context(createRoot(), undefined, 0, component);
      const child = new _Context(root);

      expect(createRoot().component).toBeUndefined();
      expect(root.component).toBe(component);
      expect(child.component).toBe(component);
      expect(child.addChild().component).toBe(component);
    });
  });

  describe('ownerOf', () => {
    it('returns the context itself when it declares the variable, initialized or not', () => {
      const context = new _Context(createRoot(), undefined, 2);
      context.addIdentifier('row', 1);
      context.declare('ref');

      expect(context.ownerOf('row')).toBe(context);
      expect(context.ownerOf('ref')).toBe(context);
    });

    it('returns the nearest ancestor declaring the variable, through scopes keeping theirs in an array or in a Map', () => {
      const root = createRoot();
      root.addIdentifier('row', 'outer');
      const middle = new _Context(root, undefined, 17);
      middle.addIdentifier('row', 'inner');
      middle.addIdentifier('other', 1);
      const scope = new _Context(middle, undefined, 1);
      scope.addIdentifier('own', 2);

      expect(scope.ownerOf('row')).toBe(middle);
      expect(scope.ownerOf('other')).toBe(middle);
      expect(new _Context(scope).ownerOf('own')).toBe(scope);
    });

    it('finds the variables of a scope declaring more than 16 of them, kept in a Map', () => {
      const context = new _Context(createRoot(), undefined, 17);
      for (let i = 0; i < 17; i++) {
        context.addIdentifier(`v${i}`, i);
      }

      expect(new _Context(context).ownerOf('v16')).toBe(context);
      expect(() => context.ownerOf('missing')).toThrow(ReferenceError);
    });

    it('throws a ReferenceError when no scope declares the variable, up to the plain parent of the root', () => {
      const root = createRoot();
      root.addIdentifier('other', 1);
      const scope = new _Context(root);

      expect(() => scope.ownerOf('row')).toThrow(new ReferenceError('"row" is not declared in this scope'));
      expect(() => createRoot().ownerOf('row')).toThrow(new ReferenceError('"row" is not declared in this scope'));
    });
  });

  describe('setNodeStrategy', () => {
    it('sets the strategy of the context and of the contexts it holds, leaving the ones holding it', () => {
      const root = createRoot();
      const context = root.addChild();
      const nested = context.addChild().addChild();
      const nodeStrategy = {} as NodeStrategy;

      context.setNodeStrategy(nodeStrategy);

      expect(context.nodeStrategy).toBe(nodeStrategy);
      expect(nested.nodeStrategy).toBe(nodeStrategy);
      expect(root.nodeStrategy).not.toBe(nodeStrategy);
    });
  });

  describe('moveTo', () => {
    it('moves the cleanups and the children to another context, leaving it empty', () => {
      const staging = createRoot();
      const target = createRoot();
      const child = staging.addChild();
      const childClear = vi.spyOn(child, 'clear');
      const cleanup = vi.fn();
      staging.addUnlistener(cleanup);

      staging.moveTo(target);
      staging.clear();
      expect(cleanup).not.toHaveBeenCalled();
      expect(childClear).not.toHaveBeenCalled();

      target.clear();
      expect(cleanup).toHaveBeenCalledOnce();
      expect(childClear).toHaveBeenCalledOnce();
    });

    it('moves the children of a context without cleanups', () => {
      const staging = createRoot();
      const target = createRoot();
      const child = staging.addChild();

      staging.moveTo(target);

      expect(target.getChildren()).toEqual([child]);
      expect(target.getUnlistenFns()).toBeNull();
      expect(staging.getChildren()).toBeNull();
    });

    it('moves the cleanups of a context without children', () => {
      const staging = createRoot();
      const target = createRoot();
      const cleanup = vi.fn();
      staging.addUnlistener(cleanup);

      staging.moveTo(target);

      expect(target.getUnlistenFns()).toEqual([cleanup]);
      expect(target.getChildren()).toBeNull();
    });
  });

  describe('update', () => {
    it('sets the value of a variable of the scope, telling whether it changed as Object.is compares', () => {
      const context = new _Context(createRoot(), undefined, 2);
      context.addIdentifier('row', 1);
      context.addIdentifier('nan', NaN);

      expect(context.update('row', 2)).toBe(true);
      expect(context.update('row', 2)).toBe(false);
      expect(context.update('nan', NaN)).toBe(false);
      expect(context.get('row')).toBe(2);
    });

    it('initializes a variable declared without a value, which is no change', () => {
      const context = createRoot();
      context.declare('total', 'let');
      context.declare('field');

      expect(context.update('total', 1)).toBe(false);
      expect(context.update('field', 'element')).toBe(false);
      expect(context.get('total')).toBe(1);
      expect(context.update('total', 2)).toBe(true);
    });

    it('sets a variable of a scope keeping its variables in a Map', () => {
      const context = new _Context(createRoot(), undefined, 17);
      for (let i = 0; i < 17; i++) {
        context.addIdentifier(`v${i}`, i);
      }

      expect(context.update('v16', 16)).toBe(false);
      expect(context.update('v16', 0)).toBe(true);
      expect(context.get('v16')).toBe(0);
    });

    it('throws for a variable the scope does not declare', () => {
      const context = new _Context(createRoot(), undefined, 1);
      expect(() => createRoot().update('row', 1)).toThrow('Identifier "row" is not declared in this scope.');
      expect(() => context.update('row', 1)).toThrow('Identifier "row" is not declared in this scope.');
    });
  });

  describe('refresh', () => {
    it('runs again, in the order they were rendered, the bindings reading a variable that changed, and only them', () => {
      const context = new _Context(createRoot(), undefined, 2);
      context.addIdentifier('row', 'a');
      context.addIdentifier('index', 0);
      const order = new Array<string>();
      const row = bindVariables(context, ['row']);
      _bindEffect(context, () => order.push('first'), null, undefined, undefined, ['row', 'index']);
      const index = bindVariables(context, ['index']);
      _bindEffect(context, () => order.push('second'), null, undefined, undefined, ['row']);

      context.update('row', 'b');
      context.refresh(['row']);

      expect(row).toEqual([['a'], ['b']]);
      expect(index).toEqual([[0]]);
      expect(order).toEqual(['first', 'second', 'first', 'second']);
    });

    it('refreshes the contexts inside the scope, which read its variables', () => {
      const context = new _Context(createRoot(), undefined, 1);
      context.addIdentifier('row', 'a');
      const branch = context.addChild();
      const nested = branch.addChild();
      const runs = bindVariables(nested, ['row']);

      context.update('row', 'b');
      context.refresh(['row']);

      expect(runs).toEqual([['a'], ['b']]);
    });

    it('makes a binding an effect when a run reads a signal, and a plain binding again when a run reads none', async () => {
      const context = new _Context(createRoot(), undefined, 1);
      context.addIdentifier('row', { flagged: false });
      const signal = new Signal.State(1);
      const runs = bindVariables(context, ['row'], signal, () => (context.get('row') as { flagged: boolean }).flagged);
      expect(Signal.subtle.hasSinks(signal)).toBe(false);

      context.update('row', { flagged: true });
      context.refresh(['row']);
      expect(Signal.subtle.hasSinks(signal)).toBe(true);

      signal.set(2);
      await flush();
      expect(runs.map(values => values[1])).toEqual([undefined, 1, 2]);

      context.update('row', { flagged: false });
      context.refresh(['row']);
      expect(Signal.subtle.hasSinks(signal)).toBe(false);

      signal.set(3);
      await flush();
      expect(runs).toHaveLength(4);
    });

    it('carries the names of an outer refresh into a refresh run inside it, and never refreshes a context twice', () => {
      const outer = new _Context(createRoot(), undefined, 1);
      outer.addIdentifier('row', 'a');
      const inner = new _Context(outer, undefined, 1);
      outer.addChild(inner);
      inner.addIdentifier('cell', 1);
      const runs = bindVariables(inner, ['row', 'cell']);
      // A binding of the outer scope refreshing the inner one, as a @for reconciling its rows does
      _bindEffect(outer, (scope: _Context) => {
        if (scope.get('row') === 'b') {
          inner.update('cell', 2);
          inner.refresh(['cell']);
        }
      }, outer, undefined, undefined, ['row']);

      outer.update('row', 'b');
      outer.refresh(['row']);

      expect(runs).toEqual([['a', 1], ['b', 2]]);
    });

    it('does not refresh the contexts created while it runs, which render with the new values', () => {
      const context = new _Context(createRoot(), undefined, 1);
      context.addIdentifier('row', 'a');
      const created = new Array<unknown[][]>();
      _bindEffect(context, (scope: _Context) => {
        // A block rendering new content, which reads the variable
        created.push(bindVariables(scope.addChild(), ['row']));
      }, context, undefined, undefined, ['row']);

      context.update('row', 'b');
      context.refresh(['row']);

      // The child created by the first run is refreshed, the one created by the refresh renders with the new value once
      expect(created).toEqual([[['a'], ['b']], [['b']]]);
    });

    it('carries the name of a variable of the scope changed while it runs on to the bindings after it and the contexts inside the scope, not beside it', () => {
      const root = new _Context(createRoot(), undefined, 1);
      root.addIdentifier('row', 'a');
      const scope = root.addChild(new _Context(root, undefined, 1));
      scope.declare('label', 'let');
      const beside = root.addChild(new _Context(root, undefined, 1));
      beside.addIdentifier('label', 'beside');
      _bindEffect(scope, (context: _Context) => {
        if (context.update('label', `${context.get('row')}!`)) {
          context.propagate('label');
        }
      }, scope, undefined, undefined, ['row']);
      const after = bindVariables(scope, ['label']);
      const inside = bindVariables(scope.addChild(), ['label']);
      const besides = bindVariables(beside, ['label']);

      root.update('row', 'b');
      root.refresh(['row']);

      expect(after).toEqual([['a!'], ['b!']]);
      expect(inside).toEqual([['a!'], ['b!']]);
      expect(besides).toEqual([['beside']]);
    });

    it('is run by a variable of the scope that changes outside of a refresh, as a @let reading a signal', () => {
      const context = new _Context(createRoot(), undefined, 1);
      context.addIdentifier('total', 1);
      const runs = bindVariables(context, ['total']);
      const refresh = vi.spyOn(context, 'refresh');

      context.update('total', 2);
      context.propagate('total');

      expect(refresh).toHaveBeenCalledExactlyOnceWith(['total']);
      expect(runs).toEqual([[1], [2]]);
    });

    it('reports the error of a binding in a microtask, keeping it as it was, and runs the other ones', async () => {
      const context = new _Context(createRoot(), undefined, 1);
      context.addIdentifier('row', 'a');
      const signal = new Signal.State(1);
      const failing = vi.fn((scope: _Context) => {
        signal.get();
        if (scope.get('row') === 'b') {
          throw new Error('boom');
        }
      });
      _bindEffect(context, failing, context, undefined, undefined, ['row']);
      const runs = bindVariables(context, ['row']);
      const tasks = new Array<() => void>();
      const queueMicrotask = vi.spyOn(globalThis, 'queueMicrotask').mockImplementation(task => { tasks.push(task); });

      context.update('row', 'b');
      context.refresh(['row']);
      queueMicrotask.mockRestore();

      expect(runs).toEqual([['a'], ['b']]);
      expect(tasks).toHaveLength(1);
      expect(() => tasks[0]()).toThrow('boom');
      // The effect of the failing binding still runs when its signal changes
      context.update('row', 'c');
      signal.set(2);
      await flush();
      expect(failing).toHaveBeenCalledTimes(3);
    });
  });

  describe('clear of the bindings', () => {
    it('disposes the effects of the bindings, which never run again', async () => {
      const context = new _Context(createRoot(), undefined, 1);
      context.addIdentifier('row', 'a');
      const signal = new Signal.State(1);
      const runs = bindVariables(context, ['row'], signal);

      context.clear();
      signal.set(2);
      await flush();

      expect(runs).toHaveLength(1);
      expect(Signal.subtle.hasSinks(signal)).toBe(false);
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

    context.clear();

    expect(node.parentNode).toBeNull();
    expect(context.getNodes()).toBeNull();
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
