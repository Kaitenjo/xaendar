import { describe, expect, it, vi } from 'vitest';
import type { ServerOutput } from '../../types/server-output.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const { _Context } = await import('@xaendar/core');
const { _ssrRenderTemplate } = await import('./ssr-template.util');

describe('_ssrRenderTemplate', () => {
  it('renders an instance with the component as this, in the context of the scope declaring the template, the value of each argument the one of its parameter', () => {
    const component = { name: 'list' };
    const declarationContext = new _Context({} as never, undefined, 1, component);
    let self: unknown;
    const render = vi.fn(function (this: unknown, out: ServerOutput, _context: unknown, params: readonly unknown[]) {
      self = this;
      out.push(params.map(param => String(param)).join(','));
    });
    declarationContext.addIdentifier('row', render);
    const out: ServerOutput = [];

    _ssrRenderTemplate(out, new _Context(new _Context(declarationContext)), 'row', [1, 'b']);

    expect(out).toEqual(['1,b']);
    expect(render.mock.calls[0][1]).toBe(declarationContext);
    expect(self).toBe(component);
  });

  it('throws a ReferenceError when no scope declares the template', () => {
    expect(() => _ssrRenderTemplate([], new _Context({} as never), 'missing', [])).toThrow(ReferenceError);
  });
});
