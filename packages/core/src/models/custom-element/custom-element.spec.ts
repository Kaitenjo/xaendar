// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { _defineRender } from '../../utils/render-registry/render-registry.util';
import { CustomElement } from './custom-element';

type TestElement = HTMLElement & { context: unknown, connectedCallback(): void };

let counter = 0;
function create(context?: unknown, styleSheet?: CSSStyleSheet): TestElement {
  const name = `x-base-${counter++}`;
  const klass = class extends CustomElement { };
  if (context) {
    _defineRender(klass, () => context as never, styleSheet);
  }

  customElements.define(name, klass);
  return document.createElement(name) as unknown as TestElement;
}

describe('CustomElement', () => {
  it('attaches an open shadow root', () => {
    expect(create().shadowRoot?.mode).toBe('open');
  });

  it('throws when no render function is registered', () => {
    const element = create();

    expect(() => element.connectedCallback()).toThrow('does not seems to have a Render Function');
  });

  it('renders on connection', () => {
    const context = { unlisten: vi.fn() };
    const element = create(context);

    document.body.appendChild(element);

    expect(element.context).toBe(context);
    expect(element.shadowRoot?.adoptedStyleSheets).toEqual([]);
    element.remove();
  });

  it('adopts the registered stylesheet on connection', () => {
    const styleSheet = new CSSStyleSheet();
    const element = create({ unlisten: vi.fn() }, styleSheet);

    document.body.appendChild(element);

    expect(element.shadowRoot?.adoptedStyleSheets).toEqual([styleSheet]);
    element.remove();
  });

  it('unlistens the context on disconnection', () => {
    const context = { unlisten: vi.fn() };
    const element = create(context);

    document.body.appendChild(element);
    element.remove();

    expect(context.unlisten).toHaveBeenCalledOnce();
  });
});
