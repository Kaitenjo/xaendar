import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _let } = await import('./let.util');
const { _Context } = await import('../context/context.util');
const { _bindEffect } = await import('../../signals/effect/effect');
const { signal } = await import('../../signals');

type Context = InstanceType<typeof _Context>;

const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Creates the context of a scope declaring a `@let`, as the generated code does.
 */
function declareLet(name: string, ...names: string[]): Context {
  const context = new _Context({} as never, undefined, names.length + 1);
  for (let i = 0; i < names.length; i++) {
    context.addIdentifier(names[i], i);
  }
  context.declare(name, 'let');
  return context;
}

/**
 * Registers a binding reading a variable of a scope, recording the values it reads.
 */
function readVariable(context: Context, name: string): unknown[] {
  const seen = new Array<unknown>();
  _bindEffect(context, (scope: Context) => { seen.push(scope.get(name)); }, context, undefined, undefined, [name]);
  return seen;
}

describe('_let', () => {
  it('writes the value into the context, which the expressions read as a value', () => {
    const context = declareLet('total');
    _let(context, 'total', () => 6);

    expect(context.get('total')).toBe(6);
  });

  it('calls the expression with the component of the context as this and the context', () => {
    const component = { price: 4 };
    const context = new _Context({} as never, undefined, 1, component);
    context.declare('total', 'let');
    const compute = vi.fn(function (this: typeof component, _context: Context) {
      return this.price * 2;
    });

    _let(context, 'total', compute);

    expect(context.get('total')).toBe(8);
    expect(compute.mock.contexts[0]).toBe(component);
    expect(compute.mock.calls[0][0]).toBe(context);
  });

  it('computes the value again once a signal it reads changes, refreshing the scope with its name', async () => {
    const price = signal(2);
    const context = declareLet('total');
    _let(context, 'total', () => price() * 3);
    const refresh = vi.spyOn(context, 'refresh');
    const seen = readVariable(context, 'total');

    price.set(5);
    await flush();

    expect(context.get('total')).toBe(15);
    expect(refresh).toHaveBeenCalledExactlyOnceWith(['total']);
    expect(seen).toEqual([6, 15]);
  });

  it('does not refresh the scope when a signal it reads changes without changing its value', async () => {
    const price = signal(2);
    const context = declareLet('even');
    _let(context, 'even', () => price() % 2 === 0);
    const refresh = vi.spyOn(context, 'refresh');

    price.set(4);
    await flush();

    expect(refresh).not.toHaveBeenCalled();
  });

  it('computes the value again when the scope is refreshed with a variable it reads, carrying its name on to the bindings after it', () => {
    const context = declareLet('label', 'row');
    _let(context, 'label', () => `#${context.get('row') as number}`, ['row']);
    const seen = readVariable(context, 'label');

    context.update('row', 7);
    context.refresh(['row']);

    expect(context.get('label')).toBe('#7');
    expect(seen).toEqual(['#0', '#7']);
  });

  it('is not computed again when the scope is refreshed with variables it does not read', () => {
    const context = declareLet('label', 'row', 'other');
    const compute = vi.fn(() => context.get('row'));
    _let(context, 'label', compute, ['row']);

    context.update('other', 9);
    context.refresh(['other']);

    expect(compute).toHaveBeenCalledOnce();
  });

  it('reads a value computed by a signal that is not a dependency of the bindings the refresh runs again', async () => {
    const price = signal(1);
    const tax = signal(10);
    const context = declareLet('total');
    _let(context, 'total', () => price());
    const runs = vi.fn();
    _bindEffect(context, (scope: Context) => {
      runs();
      tax();
      scope.get('total');
    }, context, undefined, undefined, ['total']);

    price.set(2);
    await flush();
    expect(runs).toHaveBeenCalledTimes(2);

    tax.set(20);
    await flush();
    expect(runs).toHaveBeenCalledTimes(3);
  });
});
