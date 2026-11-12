import type { _ScopeLayout } from '@xaendar/core';
import { describe, expect, it, vi } from 'vitest';
import type { ServerOutput } from '../../types/server-output.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const { _scope } = await import('@xaendar/core');
const { _ssrRenderTemplate } = await import('./ssr-template.util');

/**
 * The layout of a scope holding its header alone, whose 5 slots the runtime reserves.
 */
const EMPTY_LAYOUT: _ScopeLayout = { size: 5, nodes: 5 };

describe('_ssrRenderTemplate', () => {
  it('renders an instance with the component as this, in the scope declaring the template, some scopes up, the value of each argument the one of its parameter', () => {
    const component = { name: 'list' };
    const declarationContext = _scope(null, EMPTY_LAYOUT, undefined, component);
    let self: unknown;
    const render = vi.fn(function (this: unknown, out: ServerOutput, _context: unknown, params: readonly unknown[]) {
      self = this;
      out.push(params.map(param => String(param)).join(','));
    });
    const out: ServerOutput = [];

    _ssrRenderTemplate(out, _scope(_scope(declarationContext, EMPTY_LAYOUT), EMPTY_LAYOUT), render, 2, [1, 'b']);

    expect(out).toEqual(['1,b']);
    expect(render.mock.calls[0][1]).toBe(declarationContext);
    expect(self).toBe(component);
  });

  it('renders an instance in the scope rendering it when it declares the template', () => {
    const context = _scope(null, EMPTY_LAYOUT);
    const render = vi.fn();

    _ssrRenderTemplate([], context, render, 0, []);

    expect(render.mock.calls[0][1]).toBe(context);
  });
});
