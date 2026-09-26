// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context, mountNode } = await import('./context.util');
const { _switch } = await import('./switch.util');
const { signal } = await import('../signals');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

function createRoot() {
  return new _Context({} as never, { createElement: (tag: string) => document.createElement(tag) } as never);
}

function block(label: string) {
  return (parent: HTMLElement, parentContext: InstanceType<typeof _Context>, reference: Node | null) => {
    const context = new _Context({} as never, parentContext);
    const element = document.createElement('span');
    element.textContent = label;
    mountNode(element, parent, context, reference as Comment | null);
    return context;
  };
}

const text = (parent: HTMLElement) => Array.from(parent.querySelectorAll('span')).map(span => span.textContent);

describe('_switch', () => {
  const blocks = [
    { condition: [1], block: block('one') },
    { condition: [2, 3], block: block('two-three') },
    { condition: null, block: block('default') }
  ];

  it('renders the case matching the expression', () => {
    const parent = document.createElement('div');
    _switch(parent, createRoot(), null, () => 1, blocks);
    expect(text(parent)).toEqual(['one']);
  });

  it('matches any of the values of a case', () => {
    const parent = document.createElement('div');
    _switch(parent, createRoot(), null, () => 3, blocks);
    expect(text(parent)).toEqual(['two-three']);
  });

  it('uses strict equality', () => {
    const parent = document.createElement('div');
    _switch(parent, createRoot(), null, () => '1', blocks);
    expect(text(parent)).toEqual(['default']);
  });

  it('renders nothing when there is no match and no default', () => {
    const parent = document.createElement('div');
    _switch(parent, createRoot(), null, () => 9, blocks.slice(0, 2).concat([{ condition: [5], block: block('five') }]));
    expect(text(parent)).toEqual([]);
  });

  it('switches case reactively', async () => {
    const parent = document.createElement('div');
    const value = signal(1);
    _switch(parent, createRoot(), null, () => value(), blocks);

    value.set(2);
    await flush();

    expect(text(parent)).toEqual(['two-three']);
  });
});
