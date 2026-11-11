// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { BlockConfig } from '../../types/if/block-config.type';
import type { TemplateExpression } from '../../types/template-expression.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context, mountNode } = await import('../context/context.util');
const { _switch } = await import('./switch.util');
const { CREATE_NODES } = await import('../create-nodes/create-nodes.util');
const { _SSR_MARKERS } = await import('../../costants');
const { signal } = await import('../../signals');

type Context = InstanceType<typeof _Context>;
type Case = { readonly condition: readonly unknown[] | null, readonly block: BlockConfig['branches'][number]['block'] };

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

function createRoot() {
  return new _Context({ createElement: (tag: string) => document.createElement(tag) } as never);
}

function block(label: string) {
  return (parent: HTMLElement, parentContext: Context, reference: Node | null) => {
    const context = new _Context(parentContext);
    const element = document.createElement('span');
    element.textContent = label;
    mountNode(element, parent, context, reference as Comment | null);
    return context;
  };
}

/**
 * Builds the configuration of a `@switch`, as the compiler declares it in the module of the template.
 */
function switchOf(expression: TemplateExpression<unknown>, branches: readonly Case[], reads?: readonly string[]): BlockConfig {
  return reads ? { expression, branches, reads } : { expression, branches };
}

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

const text = (parent: HTMLElement) => Array.from(parent.querySelectorAll('span')).map(span => span.textContent);

describe('_switch', () => {
  const cases: Case[] = [
    { condition: [1], block: block('one') },
    { condition: [2, 3], block: block('two-three') },
    { condition: null, block: block('default') }
  ];

  it('renders the case matching the expression', () => {
    const parent = document.createElement('div');
    _switch(parent, createRoot(), null, switchOf(() => 1, cases));
    expect(text(parent)).toEqual(['one']);
  });

  it('matches any of the values of a case', () => {
    const parent = document.createElement('div');
    _switch(parent, createRoot(), null, switchOf(() => 3, cases));
    expect(text(parent)).toEqual(['two-three']);
  });

  it('uses strict equality', () => {
    const parent = document.createElement('div');
    _switch(parent, createRoot(), null, switchOf(() => '1', cases));
    expect(text(parent)).toEqual(['default']);
  });

  it('gets its block with the marker of a @switch', () => {
    const blockOf = vi.spyOn(CREATE_NODES, 'block');
    const context = createRoot();
    const parent = document.createElement('div');

    _switch(parent, context, null, switchOf(() => 1, cases));

    expect(blockOf).toHaveBeenCalledExactlyOnceWith(context, parent, null, 'if', _SSR_MARKERS.switch, undefined);
    blockOf.mockRestore();
  });

  it('renders the last block of its parent without anchor, appending every case it switches to at the end of the parent', async () => {
    const blockOf = vi.spyOn(CREATE_NODES, 'block');
    const context = createRoot();
    const parent = document.createElement('div');
    parent.appendChild(document.createElement('i')).textContent = 'i';
    const value = signal(1);
    const nodes = () => Array.from(parent.childNodes).map(node => `${node.nodeName}:${node.textContent}`);
    _switch(parent, context, null, { expression: () => value(), branches: cases.slice(0, 2), last: true });

    expect(blockOf).toHaveBeenCalledExactlyOnceWith(context, parent, null, 'if', _SSR_MARKERS.switch, true);
    expect(nodes()).toEqual(['I:i', 'SPAN:one']);

    value.set(2);
    await flush();
    expect(nodes()).toEqual(['I:i', 'SPAN:two-three']);

    value.set(9);
    await flush();
    expect(nodes()).toEqual(['I:i']);

    value.set(1);
    await flush();
    expect(nodes()).toEqual(['I:i', 'SPAN:one']);
    blockOf.mockRestore();
  });

  it.each([
    ['a single case', 1],
    ['two cases', 2],
    ['three cases', 3]
  ])('renders nothing when there is no match and no default, with %s', (_description, count) => {
    const parent = document.createElement('div');
    const onlyCases = [cases[0], cases[1], { condition: [5], block: block('five') }];
    _switch(parent, createRoot(), null, switchOf(() => 9, onlyCases.slice(0, count)));
    expect(text(parent)).toEqual([]);
  });

  it('renders nothing, but its anchor, when it declares no branch', () => {
    const parent = document.createElement('div');
    _switch(parent, createRoot(), null, switchOf(() => 9, []));
    expect(Array.from(parent.childNodes).map(node => node.nodeType)).toEqual([Node.COMMENT_NODE]);
  });

  it('renders the second of two cases when it matches', () => {
    const parent = document.createElement('div');
    _switch(parent, createRoot(), null, switchOf(() => 2, cases.slice(0, 2)));
    expect(text(parent)).toEqual(['two-three']);
  });

  it('destroys the active case when none of two cases matches anymore', async () => {
    const parent = document.createElement('div');
    const value = signal(2);
    _switch(parent, createRoot(), null, switchOf(() => value(), cases.slice(0, 2)));
    expect(text(parent)).toEqual(['two-three']);

    value.set(9);
    await flush();

    expect(text(parent)).toEqual([]);
  });

  it('renders the default when it is the only branch', () => {
    const parent = document.createElement('div');
    _switch(parent, createRoot(), null, switchOf(() => 9, cases.slice(2)));
    expect(text(parent)).toEqual(['default']);
  });

  it('renders the default following a single case when the case does not match', () => {
    const parent = document.createElement('div');
    _switch(parent, createRoot(), null, switchOf(() => 9, [cases[0], cases[2]]));
    expect(text(parent)).toEqual(['default']);
  });

  it('switches case reactively', async () => {
    const parent = document.createElement('div');
    const value = signal(1);
    _switch(parent, createRoot(), null, switchOf(() => value(), cases));

    value.set(2);
    await flush();

    expect(text(parent)).toEqual(['two-three']);
  });

  it('evaluates the expression once per run, whatever case matches', async () => {
    const value = signal(4);
    const expression = vi.fn(() => value());
    _switch(document.createElement('div'), createRoot(), null, switchOf(expression, cases));
    expect(expression).toHaveBeenCalledOnce();

    value.set(3);
    await flush();
    expect(expression).toHaveBeenCalledTimes(2);
  });

  it('renders the matching case rather than a default written before it, and the default only when no case matches', async () => {
    const parent = document.createElement('div');
    const value = signal(2);
    _switch(parent, createRoot(), null, switchOf(() => value(), [
      { condition: null, block: block('default') },
      { condition: [2], block: block('two') }
    ]));
    expect(text(parent)).toEqual(['two']);

    value.set(5);
    await flush();
    expect(text(parent)).toEqual(['default']);

    value.set(2);
    await flush();
    expect(text(parent)).toEqual(['two']);
  });

  it('renders nothing when no case matches and there is no default', async () => {
    const parent = document.createElement('div');
    const value = signal(1);
    _switch(parent, createRoot(), null, switchOf(() => value(), cases.slice(0, 2)));
    expect(text(parent)).toEqual(['one']);

    value.set(9);
    await flush();
    expect(text(parent)).toEqual([]);
  });

  it('calls the expression with the component of the context as this and the context', () => {
    const component = { mode: 2 };
    const context = new _Context(createRoot(), undefined, 0, component);
    const expression = vi.fn(function (this: typeof component, _context: Context) {
      return this.mode;
    });
    const parent = document.createElement('div');

    _switch(parent, context, null, switchOf(expression, cases));

    expect(text(parent)).toEqual(['two-three']);
    expect(expression.mock.contexts[0]).toBe(component);
    expect(expression.mock.calls[0][0]).toBe(context);
  });

  it('follows a variable of the template its expression reads when the scope is refreshed with it', () => {
    const context = new _Context(createRoot(), undefined, 1);
    context.addIdentifier('mode', 1);
    const parent = document.createElement('div');
    _switch(parent, context, null, switchOf(scope => scope.get('mode'), cases, ['mode']));

    context.update('mode', 3);
    context.refresh(['mode']);

    expect(text(parent)).toEqual(['two-three']);
  });

  it('shares the same config and the same expression between two instances of the block, each reading its own context, without writing into the config', () => {
    const expression = vi.fn((scope: Context) => scope.get('mode'));
    const config = deepFreeze(switchOf(expression, [
      { condition: [1], block: block('one') },
      { condition: null, block: block('default') }
    ], ['mode']));
    const first = new _Context(createRoot(), undefined, 1);
    const second = new _Context(createRoot(), undefined, 1);
    first.addIdentifier('mode', 1);
    second.addIdentifier('mode', 7);
    const firstParent = document.createElement('div');
    const secondParent = document.createElement('div');

    _switch(firstParent, first, null, config);
    _switch(secondParent, second, null, config);

    const scopes = new Map([[first, 'first'], [second, 'second']]);
    expect(text(firstParent)).toEqual(['one']);
    expect(text(secondParent)).toEqual(['default']);

    second.update('mode', 1);
    second.refresh(['mode']);
    first.update('mode', 4);
    first.refresh(['mode']);

    expect(text(firstParent)).toEqual(['default']);
    expect(text(secondParent)).toEqual(['one']);
    expect(expression.mock.calls.map(call => scopes.get(call[0]))).toEqual(['first', 'second', 'second', 'first']);
  });
});
