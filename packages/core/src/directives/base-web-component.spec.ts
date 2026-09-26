// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { BaseWebComponent } from './base-web-component';

type TestElement = HTMLElement & { _render(): unknown, context: unknown };

let counter = 0;
function create(): TestElement {
  const name = `x-base-${counter++}`;
  customElements.define(name, class extends BaseWebComponent { });
  return document.createElement(name) as unknown as TestElement;
}

describe('BaseWebComponent', () => {
  it('attaches an open shadow root', () => {
    expect(create().shadowRoot?.mode).toBe('open');
  });

  it('returns an empty context from the default _render', () => {
    expect(create()._render()).toEqual({});
  });

  it('renders on connection', () => {
    const element = create();
    const context = { unlisten: vi.fn() };
    vi.spyOn(element, '_render').mockReturnValue(context);

    document.body.appendChild(element);

    expect(element.context).toBe(context);
    element.remove();
  });

  it('unlistens the context on disconnection', () => {
    const element = create();
    const context = { unlisten: vi.fn() };
    vi.spyOn(element, '_render').mockReturnValue(context);

    document.body.appendChild(element);
    element.remove();

    expect(context.unlisten).toHaveBeenCalledOnce();
  });
});
