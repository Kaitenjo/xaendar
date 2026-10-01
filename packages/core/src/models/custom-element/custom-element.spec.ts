// @vitest-environment happy-dom
import { loadSignals } from '@xaendar/signals';
import { describe, expect, it, vi } from 'vitest';
import { effect } from '../../signals/effect/effect';
import { _defineRender } from '../../utils/render-registry/render-registry.util';
import { CustomElement } from './custom-element';

loadSignals();

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
    const context = { listen: vi.fn(), unlisten: vi.fn() };
    const element = create(context);

    document.body.appendChild(element);

    expect(element.context).toBe(context);
    expect(element.shadowRoot?.adoptedStyleSheets).toEqual([]);
    element.remove();
  });

  it('adopts the registered stylesheet on connection', () => {
    const styleSheet = new CSSStyleSheet();
    const element = create({ listen: vi.fn(), unlisten: vi.fn() }, styleSheet);

    document.body.appendChild(element);

    expect(element.shadowRoot?.adoptedStyleSheets).toEqual([styleSheet]);
    element.remove();
  });

  it('unlistens the context on disconnection', () => {
    const context = { listen: vi.fn(), unlisten: vi.fn() };
    const element = create(context);

    document.body.appendChild(element);
    element.remove();

    expect(context.unlisten).toHaveBeenCalledOnce();
  });

  describe('onInit', () => {
    /**
     * Builds a connectable element whose context really stores what is passed to `listen`
     * and runs it on `unlisten`, with the given `onInit`.
     */
    function createWithOnInit(onInit: () => Array<() => void> | void) {
      const listened = new Array<() => void>();
      const context = {
        listen: vi.fn((...fns: Array<() => void>) => listened.push(...fns)),
        unlisten: vi.fn(() => listened.splice(0).forEach(fn => fn()))
      };
      const name = `x-base-${counter++}`;
      const klass = class extends CustomElement {
        public onInit = onInit;
      };
      _defineRender(klass, () => context as never);
      customElements.define(name, klass);

      return { element: document.createElement(name), context };
    }

    it('listens to the unlisten functions returned by onInit', () => {
      const unlisten = vi.fn();
      const { element, context } = createWithOnInit(() => [unlisten]);

      document.body.appendChild(element);
      expect(context.listen).toHaveBeenCalledWith(unlisten);
      expect(unlisten).not.toHaveBeenCalled();

      element.remove();
      expect(unlisten).toHaveBeenCalledOnce();
    });

    it('disposes on disconnection the effects created in onInit', () => {
      const onCleanup = vi.fn();
      const { element } = createWithOnInit(() => {
        effect(() => undefined, { onCleanup });
      });

      document.body.appendChild(element);
      expect(onCleanup).not.toHaveBeenCalled();

      element.remove();
      expect(onCleanup).toHaveBeenCalledOnce();
    });

    it('does not fail when an effect created in onInit is also returned for cleanup', () => {
      const onCleanup = vi.fn();
      const { element } = createWithOnInit(() => [effect(() => undefined, { onCleanup })]);

      document.body.appendChild(element);

      expect(() => element.remove()).not.toThrow();
      expect(onCleanup).toHaveBeenCalledOnce();
    });

    it('creates new effects and disposes the old ones when it is connected again', () => {
      const onCleanup = vi.fn();
      const onInit = vi.fn(() => {
        effect(() => undefined, { onCleanup });
      });
      const { element } = createWithOnInit(onInit);

      document.body.appendChild(element);
      element.remove();
      document.body.appendChild(element);

      expect(onInit).toHaveBeenCalledTimes(2);
      expect(onCleanup).toHaveBeenCalledOnce();

      element.remove();
      expect(onCleanup).toHaveBeenCalledTimes(2);
    });

    it('does not dispose the effects created outside of onInit', () => {
      const onCleanup = vi.fn();
      const { element } = createWithOnInit(() => undefined);
      effect(() => undefined, { onCleanup });

      document.body.appendChild(element);
      element.remove();

      expect(onCleanup).not.toHaveBeenCalled();
    });
  });
});
