import { describe, expect, it, vi } from 'vitest';
import type { ServerOutput } from '../../types/server-output/server-output.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const { _Context } = await import('@xaendar/core');
const { _ssrRenderTemplate, _ssrTemplate } = await import('./ssr-template.util');

describe('ssr templates', () => {
  it('holds the context of the scope declaring the template with its render function', () => {
    const context = new _Context({} as never);
    const render = vi.fn();

    expect(_ssrTemplate(context, render)).toEqual({ context, render });
  });

  it('renders an instance in the context of the declaration, each argument the signal of its parameter', () => {
    const declarationContext = new _Context({} as never);
    const render = vi.fn((out: ServerOutput, _context: unknown, params: Array<() => unknown>) => {
      out.push(params.map(param => String(param())).join(','));
    });
    const out: ServerOutput = [];

    _ssrRenderTemplate(out, new _Context({} as never), _ssrTemplate(declarationContext, render), [() => 1, () => 'b']);

    expect(out).toEqual(['1,b']);
    expect(render.mock.calls[0][1]).toBe(declarationContext);
  });
});
