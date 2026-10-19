// @vitest-environment happy-dom
import { EffectOptions, loadSignals } from '@xaendar/signals';
import { Constructor, NoArgsVoidFunction } from '@xaendar/types';
import { describe, expect, it, vi } from 'vitest';
import { CONNECTED_HOOKS, DISCONNECTED_HOOKS } from '../../costants';
import { HostProperty } from '../../decorators/host-property/host-property.decorator';
import { effect } from '../../signals/effect/effect';
import { _Context } from '../../utils/context/context.util';
import { _defineRender } from '../../utils/render-registry/render-registry.util';
import { CustomDirective } from '../custom-directive/custom-directive';
import { CustomElement } from './custom-element';

loadSignals();

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

type TestElement = HTMLElement & {
  _context: _Context,
  connectedCallback(): void,
  effect(fn: NoArgsVoidFunction, options?: EffectOptions): NoArgsVoidFunction
};

/**
 * Builds a context whose `clear` is spied on, still clearing it (so disposing the effects
 * registered on it) after invoking the optional `onClear` callback.
 */
function createContext(onClear?: NoArgsVoidFunction): _Context {
  const context = new _Context({} as never);
  const clear = context.clear.bind(context);
  vi.spyOn(context, 'clear').mockImplementation(() => {
    onClear?.();
    clear();
  });

  return context;
}

let counter = 0;
function create(context?: _Context, styleSheet?: CSSStyleSheet): TestElement {
  const name = `x-base-${counter++}`;
  const klass = class extends CustomElement { };
  if (context) {
    _defineRender(klass, () => context, styleSheet);
  }

  customElements.define(name, klass);
  return document.createElement(name) as unknown as TestElement;
}

/**
 * Builds a connectable element with the given lifecycle hooks, whose render function
 * returns a context invoking `onClear` when it is cleared.
 */
function createWithHooks(hooks: { onInit?: (element: TestElement) => void, afterRender?: () => void, onDestroy?: () => void, onClear?: NoArgsVoidFunction }) {
  const context = createContext(hooks.onClear);
  const render = vi.fn(() => context);
  const name = `x-base-${counter++}`;
  const klass = class extends CustomElement {
    public onInit = hooks.onInit && (() => hooks.onInit!(this as unknown as TestElement));
    public afterRender = hooks.afterRender;
    public onDestroy = hooks.onDestroy;
  };
  _defineRender(klass, render);
  customElements.define(name, klass);

  return { element: document.createElement(name) as unknown as TestElement, context, render };
}

describe('CustomElement', () => {
  it('attaches an open shadow root', () => {
    expect(create().shadowRoot?.mode).toBe('open');
  });

  it('throws when no render function is registered', () => {
    const element = create();

    expect(() => element.connectedCallback()).toThrow('does not seem to have a Render Function');
  });

  it('renders on connection', () => {
    const context = createContext();
    const element = create(context);

    document.body.appendChild(element);

    expect(element._context).toBe(context);
    expect(element.shadowRoot?.adoptedStyleSheets).toEqual([]);
    element.remove();
  });

  it('adopts the registered stylesheet on connection', () => {
    const styleSheet = new CSSStyleSheet();
    const element = create(createContext(), styleSheet);

    document.body.appendChild(element);

    expect(element.shadowRoot?.adoptedStyleSheets).toEqual([styleSheet]);
    element.remove();
  });

  it('clears the context on disconnection', () => {
    const context = createContext();
    const element = create(context);

    document.body.appendChild(element);
    element.remove();

    expect(context.clear).toHaveBeenCalledOnce();
  });

  describe('onInit', () => {
    it('is invoked before the render', () => {
      const calls = new Array<string>();
      const { element, render } = createWithHooks({ onInit: () => { calls.push('onInit'); } });
      render.mockImplementation(() => {
        calls.push('render');
        return createContext();
      });

      document.body.appendChild(element);

      expect(calls).toEqual(['onInit', 'render']);
      element.remove();
    });

    it('does not dispose on disconnection the effects created via the standalone effect function', () => {
      const onCleanup = vi.fn();
      const { element } = createWithHooks({
        onInit: () => {
          effect(() => undefined, { onCleanup });
        }
      });

      document.body.appendChild(element);
      element.remove();

      expect(onCleanup).not.toHaveBeenCalled();
    });
  });

  describe('afterRender', () => {
    it('is invoked after the render', () => {
      const calls = new Array<string>();
      const { element, render } = createWithHooks({
        onInit: () => { calls.push('onInit'); },
        afterRender: () => { calls.push('afterRender'); }
      });
      render.mockImplementation(() => {
        calls.push('render');
        return createContext();
      });

      document.body.appendChild(element);

      expect(calls).toEqual(['onInit', 'render', 'afterRender']);
      element.remove();
    });
  });

  describe('onDestroy', () => {
    it('is invoked on disconnection, before clearing the context, which disposes the effects', () => {
      const calls = new Array<string>();
      const { element } = createWithHooks({
        onInit: element => {
          element.effect(() => undefined, { onCleanup: () => calls.push('dispose') });
        },
        onDestroy: () => calls.push('onDestroy'),
        onClear: () => calls.push('clear')
      });

      document.body.appendChild(element);
      element.remove();

      expect(calls).toEqual(['onDestroy', 'clear', 'dispose']);
    });
  });

  describe('connectedMoveCallback', () => {
    it('keeps the render and the effects of an element moved with moveBefore, running no hook', async () => {
      const onInit = vi.fn();
      const onDestroy = vi.fn();
      const { element, context, render } = createWithHooks({ onInit, onDestroy });
      document.body.appendChild(element);
      const source = new Signal.State(0);
      const run = vi.fn(() => source.get());
      element.effect(run);
      onInit.mockClear();

      (element as unknown as { connectedMoveCallback(): void }).connectedMoveCallback();
      source.set(1);
      await flush();

      expect(onInit).not.toHaveBeenCalled();
      expect(onDestroy).not.toHaveBeenCalled();
      expect(render).toHaveBeenCalledOnce();
      expect(element._context).toBe(context);
      expect(run).toHaveBeenCalledTimes(2);
      element.remove();
    });
  });

  describe('internal hooks', () => {
    it('invokes the connected hooks right after the render, before afterRender', () => {
      const calls = new Array<string>();
      const { element, render } = createWithHooks({ afterRender: () => { calls.push('afterRender'); } });
      render.mockImplementation(() => {
        calls.push('render');
        return createContext();
      });
      (element as unknown as CustomElement)[CONNECTED_HOOKS].push(() => calls.push('hook'));

      document.body.appendChild(element);

      expect(calls).toEqual(['render', 'hook', 'afterRender']);
      element.remove();
    });

    it('invokes the disconnected hooks after onDestroy and the clearing of the context', () => {
      const calls = new Array<string>();
      const { element } = createWithHooks({ onDestroy: () => calls.push('onDestroy'), onClear: () => calls.push('clear') });
      (element as unknown as CustomElement)[DISCONNECTED_HOOKS].push(() => calls.push('hook'));

      document.body.appendChild(element);
      element.remove();

      expect(calls).toEqual(['onDestroy', 'clear', 'hook']);
    });
  });

  describe('host bindings', () => {
    it('binds the host element after the connected hooks, before afterRender, and unbinds it on disconnection', () => {
      const calls = new Array<string>();
      const { element, render } = createWithHooks({ afterRender: () => { calls.push('afterRender'); } });
      render.mockImplementation(() => {
        calls.push('render');
        return createContext();
      });
      (element as unknown as CustomElement)[CONNECTED_HOOKS].push(() => calls.push('hook'));
      const metadata: DecoratorMetadataObject = {};
      const read = () => {
        calls.push('binding');
        return 'switch';
      };
      (HostProperty('role') as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: 'role', static: false, metadata, access: { get: read } });
      Object.defineProperty(element.constructor, Symbol.for('Symbol.metadata'), { value: metadata });

      document.body.appendChild(element);
      expect(calls).toEqual(['render', 'hook', 'binding', 'afterRender']);
      expect(element.getAttribute('role')).toBe('switch');

      element.remove();
      expect(element.hasAttribute('role')).toBe(false);
    });
  });

  describe('host directives', () => {
    /**
     * Directive recording the calls of its lifecycle in the given list, and the effects it creates.
     */
    function createDirective(calls: string[], onCleanup?: NoArgsVoidFunction) {
      return class extends CustomDirective {
        public onInit(): void {
          calls.push('directive onInit');
          this.effect(() => undefined, { onCleanup });
        }

        public onDestroy(): void {
          calls.push('directive onDestroy');
        }
      };
    }

    /**
     * Builds a component declaring the given host directives, recording its own lifecycle in the same list.
     */
    function createHost(calls: string[], Directive: Constructor<CustomDirective>) {
      const context = createContext(() => calls.push('clear'));
      const klass = class extends CustomElement {
        public onInit(): void {
          calls.push('onInit');
        }

        public onDestroy(): void {
          calls.push('onDestroy');
        }
      };
      Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: { hostDirectives: [Directive] } });
      _defineRender(klass, () => {
        calls.push('render');
        return context;
      });
      const name = `x-base-${counter++}`;
      customElements.define(name, klass);

      return document.createElement(name) as unknown as TestElement;
    }

    it('are available before the component is connected', () => {
      const Directive = createDirective([]);
      const element = createHost([], Directive);

      expect((element as unknown as CustomElement).hostDirectives.get(Directive)).toBeInstanceOf(Directive);
    });

    it('is empty for a component declaring none', () => {
      expect((create() as unknown as CustomElement).hostDirectives.size).toBe(0);
    });

    it('are started before the component, which finds them ready, and stopped after it', () => {
      const calls = new Array<string>();
      const element = createHost(calls, createDirective(calls));

      document.body.appendChild(element);
      element.remove();

      expect(calls).toEqual(['directive onInit', 'onInit', 'render', 'onDestroy', 'clear', 'directive onDestroy']);
    });

    it('dispose their effects on disconnection, and are started again on reconnection', () => {
      const calls = new Array<string>();
      const onCleanup = vi.fn();
      const element = createHost(calls, createDirective(calls, onCleanup));

      document.body.appendChild(element);
      expect(onCleanup).not.toHaveBeenCalled();
      element.remove();
      expect(onCleanup).toHaveBeenCalledOnce();

      document.body.appendChild(element);
      element.remove();
      expect(onCleanup).toHaveBeenCalledTimes(2);
      expect(calls.filter(call => call === 'directive onInit')).toHaveLength(2);
    });

    it('are not started when the component cannot render', () => {
      const calls = new Array<string>();
      const klass = class extends CustomElement { };
      Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: { hostDirectives: [createDirective(calls)] } });
      const name = `x-base-${counter++}`;
      customElements.define(name, klass);
      const element = document.createElement(name) as unknown as TestElement;

      expect(() => element.connectedCallback()).toThrow('does not seem to have a Render Function');
      expect(calls).toEqual([]);
    });
  });

  describe('effect', () => {
    it('can be created in onInit, before the first render', async () => {
      const state = new Signal.State(0);
      const spy = vi.fn();
      const { element } = createWithHooks({
        onInit: element => {
          element.effect(() => spy(state.get()));
        }
      });

      expect(() => document.body.appendChild(element)).not.toThrow();
      expect(spy).toHaveBeenCalledExactlyOnceWith(0);

      state.set(1);
      await flush();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(1);
      element.remove();
    });

    it('forwards the options to the underlying effect', () => {
      const onBeforeRun = vi.fn();
      const onAfterRun = vi.fn();
      const { element } = createWithHooks({});

      element.effect(() => undefined, { onBeforeRun, onAfterRun });

      expect(onBeforeRun).toHaveBeenCalledOnce();
      expect(onAfterRun).toHaveBeenCalledOnce();
    });

    it('is disposed on disconnection', async () => {
      const state = new Signal.State(0);
      const spy = vi.fn();
      const onCleanup = vi.fn();
      const { element } = createWithHooks({
        onInit: element => {
          element.effect(() => spy(state.get()), { onCleanup });
        }
      });

      document.body.appendChild(element);
      expect(onCleanup).not.toHaveBeenCalled();

      element.remove();
      expect(onCleanup).toHaveBeenCalledOnce();

      state.set(1);
      await flush();
      expect(spy).toHaveBeenCalledOnce();
    });

    it('returns a disposer that stops the effect ahead of the disconnection', async () => {
      const state = new Signal.State(0);
      const spy = vi.fn();
      const onCleanup = vi.fn();
      const { element } = createWithHooks({});
      document.body.appendChild(element);

      const dispose = element.effect(() => spy(state.get()), { onCleanup });
      dispose();
      state.set(1);
      await flush();

      expect(spy).toHaveBeenCalledOnce();
      expect(onCleanup).toHaveBeenCalledOnce();
      element.remove();
    });

    describe('created outside of a connection', () => {
      it('is disposed by its disposer before the connection', () => {
        const onCleanup = vi.fn();
        const run = vi.fn();
        const { element } = createWithHooks({});
        const dispose = element.effect(run, { onCleanup });

        dispose();
        document.body.appendChild(element);

        expect(run).toHaveBeenCalledOnce();
        expect(onCleanup).toHaveBeenCalledOnce();
        element.remove();
      });
    });
  });
});
