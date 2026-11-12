import { describe, expect, it, vi } from 'vitest';
import { HEADER } from '../../costants';
import type { _Context } from '../../types/context.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _let } = await import('./let.util');
const { _declare, _scope, refresh, update } = await import('../context/context.util');
const { _bindEffect } = await import('../../signals/effect/effect');
const { signal } = await import('../../signals');

const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Creates the scope declaring a `@let`, as the generated code does: the `@let` in the first slot, identifier `0`, then
 * the other variables named, each one holding its index, identifiers from `1`.
 */
function declareLet(name: string, ...names: string[]): _Context {
  const variables = [name, ...names];
  const context = _scope(null, { size: HEADER + variables.length, nodes: HEADER + variables.length, variables });
  _declare(context, HEADER, 'let');
  for (let i = 0; i < names.length; i++) {
    context[HEADER + 1 + i] = i;
  }
  return context;
}

/**
 * Registers a binding reading a variable, by slot and identifier, recording its values.
 */
function readVariable(context: _Context, slot: number, id: number): unknown[] {
  const seen = new Array<unknown>();
  _bindEffect(context, (scope: _Context) => { seen.push(scope[slot]); }, context, undefined, undefined, [id]);
  return seen;
}

describe('_let', () => {
  it('writes the value into its slot, which the expressions read as a value', () => {
    const context = declareLet('total');
    _let(context, HEADER, 0, () => 6);

    expect(context[HEADER]).toBe(6);
  });

  it('calls the expression with the component of the context as this and the context', () => {
    const component = { price: 4 };
    const context = _scope(null, { size: HEADER + 1, nodes: HEADER + 1, variables: ['total'] }, undefined, component);
    _declare(context, HEADER, 'let');
    const compute = vi.fn(function (this: typeof component, _context: _Context) {
      return this.price * 2;
    });

    _let(context, HEADER, 0, compute);

    expect(context[HEADER]).toBe(8);
    expect(compute.mock.contexts[0]).toBe(component);
    expect(compute.mock.calls[0][0]).toBe(context);
  });

  it('computes the value again once a signal it reads changes, refreshing the scope with its identifier', async () => {
    const price = signal(2);
    const context = declareLet('total');
    _let(context, HEADER, 0, () => price() * 3);
    const seen = readVariable(context, HEADER, 0);

    price.set(5);
    await flush();

    expect(context[HEADER]).toBe(15);
    expect(seen).toEqual([6, 15]);
  });

  it('does not refresh the scope when a signal it reads changes without changing its value', async () => {
    const price = signal(2);
    const context = declareLet('even');
    _let(context, HEADER, 0, () => price() % 2 === 0);
    const seen = readVariable(context, HEADER, 0);

    price.set(4);
    await flush();

    expect(seen).toEqual([true]);
  });

  it('computes the value again when the scope is refreshed with a variable it reads, carrying its identifier on to the bindings after it', () => {
    const context = declareLet('label', 'row');
    _let(context, HEADER, 0, () => `#${context[HEADER + 1] as number}`, [1]);
    const seen = readVariable(context, HEADER, 0);

    update(context, HEADER + 1, 7);
    refresh(context, [1]);

    expect(context[HEADER]).toBe('#7');
    expect(seen).toEqual(['#0', '#7']);
  });

  it('is not computed again when the scope is refreshed with variables it does not read', () => {
    const context = declareLet('label', 'row', 'other');
    const compute = vi.fn(() => context[HEADER + 1]);
    _let(context, HEADER, 0, compute, [1]);

    update(context, HEADER + 2, 9);
    refresh(context, [2]);

    expect(compute).toHaveBeenCalledOnce();
  });

  it('reads a value computed by a signal that is not a dependency of the bindings the refresh runs again', async () => {
    const price = signal(1);
    const tax = signal(10);
    const context = declareLet('total');
    _let(context, HEADER, 0, () => price());
    const runs = vi.fn();
    _bindEffect(context, (scope: _Context) => {
      runs();
      tax();
      return scope[HEADER];
    }, context, undefined, undefined, [0]);

    price.set(2);
    await flush();
    expect(runs).toHaveBeenCalledTimes(2);

    tax.set(20);
    await flush();
    expect(runs).toHaveBeenCalledTimes(3);
  });

  it('packs a slot and a large identifier without mixing them', async () => {
    const context = _scope(null, { size: HEADER + 1, nodes: HEADER + 1, variables: ['total'] });
    const price = signal(1);
    _let(context, HEADER, 70000, () => price());
    const seen = readVariable(context, HEADER, 70000);

    price.set(2);
    await flush();

    expect(seen).toEqual([1, 2]);
  });
});
