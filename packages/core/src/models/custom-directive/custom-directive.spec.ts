// @vitest-environment happy-dom
import { loadSignals } from '@xaendar/signals';
import { describe, expect, it, vi } from 'vitest';
import { CLEANUP, DIRECTIVE_AFTER_RENDER, DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT, SET_DIRECTIVE_ELEMENT, SET_DIRECTIVE_EVENTS } from '../../costants';
import { HostAttribute } from '../../decorators/host-attribute/host-attribute.decorator';
import { HostListener } from '../../decorators/host-listener/host-listener.decorator';
import { effect } from '../../signals/effect/effect';
import type { _Context } from '../../types/context.type';
import { EMPTY_LAYOUT, _scope, addCleanup, clear, forEachChild } from '../../utils/context/context.util';
import { _defineRender } from '../../utils/render-registry/render-registry.util';
import { CustomElement } from '../custom-element/custom-element';
import { CustomDirective } from './custom-directive';

/**
 * The scopes a scope holds: the ones of its containers, then the ones its cleanups hold, as the branch of a conditional
 * binding or the scope of a component created in code.
 */
function childrenOf(context: _Context): _Context[] {
  const children = new Array<_Context>();
  forEachChild(context, (child, list) => list.push(child), children);
  const cleanup = context[CLEANUP];
  const cleanups = Array.isArray(cleanup) ? cleanup : cleanup ? [cleanup] : [];
  for (let i = 0; i < cleanups.length; i++) {
    const item = cleanups[i];
    if (typeof item !== 'function' && 'scope' in item) {
      children.push(item.scope as _Context);
    }
  }

  return children;
}

loadSignals();

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

class TestDirective extends CustomDirective {
  public readonly onInitSpy = vi.fn<(directive: TestDirective) => void>();

  public onInit(): void {
    this.onInitSpy(this);
  }
}

/**
 * Builds a directive applied to the given element, as the template runtime does.
 */
function create<T extends CustomDirective>(Directive: new () => T, element = document.createElement('div')): T {
  const directive = new Directive();
  directive[SET_DIRECTIVE_ELEMENT] = element;

  return directive;
}

/**
 * Connects the directive to a new context as the template runtime does: clearing the
 * returned context disconnects the directive and disposes its effects.
 */
function connect(directive: CustomDirective): _Context {
  const context = _scope(null, EMPTY_LAYOUT);
  addCleanup(context, () => directive[DIRECTIVE_DISCONNECT]());
  directive[DIRECTIVE_CONNECT](context);

  return context;
}

/**
 * A component created by the directives under test.
 */
const Child = (() => {
  const klass = class extends CustomElement { };
  Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: { selector: 'x-directive-created' } });
  _defineRender(klass, () => _scope(null, EMPTY_LAYOUT));
  customElements.define('x-directive-created', klass);

  return klass;
})();

describe('CustomDirective', () => {
  it('exposes the element it is applied to', () => {
    const element = document.createElement('div');

    expect(create(TestDirective, element).element).toBe(element);
  });

  it('does not invoke onInit until it is connected', () => {
    const directive = create(TestDirective);

    expect(directive.onInitSpy).not.toHaveBeenCalled();
  });

  it('invokes onInit when connected', () => {
    const directive = create(TestDirective);
    connect(directive);

    expect(directive.onInitSpy).toHaveBeenCalledOnce();
  });

  it('invokes afterRender only when asked, and does nothing without the hook', () => {
    const calls = new Array<string>();
    const Hooked = class extends CustomDirective {
      public afterRender(): void {
        calls.push('afterRender');
      }
    };
    const hooked = create(Hooked);
    connect(hooked);
    expect(calls).toEqual([]);

    hooked[DIRECTIVE_AFTER_RENDER]();
    expect(calls).toEqual(['afterRender']);
    expect(() => create(TestDirective)[DIRECTIVE_AFTER_RENDER]()).not.toThrow();
  });

  it('lets the error of afterRender through', () => {
    const Failing = class extends CustomDirective {
      public afterRender(): void {
        throw new Error('boom');
      }
    };
    const directive = create(Failing);
    connect(directive);

    expect(() => directive[DIRECTIVE_AFTER_RENDER]()).toThrow('boom');
  });

  it('binds its element after onInit, and unbinds it when disconnected', () => {
    const calls = new Array<string>();
    const Klass = class extends TestDirective { };
    const metadata: DecoratorMetadataObject = {};
    const handle = vi.fn();
    (HostAttribute('class.on') as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: 'on', static: false, metadata, access: { get: () => calls.push('binding') } });
    (HostListener('click') as unknown as (value: unknown, context: unknown) => void)(handle, { kind: 'method', name: 'handle', static: false, metadata, access: { get: () => handle } });
    Object.defineProperty(Klass, Symbol.for('Symbol.metadata'), { value: metadata });
    const element = document.createElement('div');
    const directive = create(Klass, element);
    directive.onInitSpy.mockImplementation(() => calls.push('onInit'));

    const context = connect(directive);
    expect(calls).toEqual(['onInit', 'binding']);
    expect(element.classList.contains('on')).toBe(true);
    element.click();
    expect(handle).toHaveBeenCalledOnce();

    clear(context);
    expect(element.classList.contains('on')).toBe(false);
    element.click();
    expect(handle).toHaveBeenCalledOnce();
  });

  it('can be connected and disconnected without onInit and onDestroy', () => {
    const directive = create(class extends CustomDirective { });

    expect(() => clear(connect(directive))).not.toThrow();
  });

  it('invokes onDestroy before disposing its effects when disconnected', () => {
    const calls = new Array<string>();
    const directive = create(class extends TestDirective {
      public onDestroy(): void {
        calls.push('onDestroy');
      }
    });
    directive.onInitSpy.mockImplementation(directive => {
      directive.effect(() => undefined, { onCleanup: () => calls.push('dispose') });
    });

    clear(connect(directive));

    expect(calls).toEqual(['onDestroy', 'dispose']);
  });

  it('disposes its effects only once when disconnected twice', () => {
    const onCleanup = vi.fn();
    const directive = create(TestDirective);
    directive.onInitSpy.mockImplementation(directive => {
      directive.effect(() => undefined, { onCleanup });
    });
    const context = connect(directive);

    clear(context);
    clear(context);

    expect(onCleanup).toHaveBeenCalledOnce();
  });

  it('does not dispose on disconnection the effects created outside of the directive', () => {
    const onCleanup = vi.fn();
    const directive = create(TestDirective);
    directive.onInitSpy.mockImplementation(() => {
      effect(() => undefined, { onCleanup });
    });

    clear(connect(directive));

    expect(onCleanup).not.toHaveBeenCalled();
  });

  describe('effect', () => {
    it('runs immediately and re-runs when a tracked signal changes', async () => {
      const state = new Signal.State(0);
      const spy = vi.fn();
      const directive = create(TestDirective);
      connect(directive);

      directive.effect(() => spy(state.get()));
      expect(spy).toHaveBeenCalledExactlyOnceWith(0);

      state.set(1);
      await flush();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(1);
    });

    it('forwards the options to the underlying effect', () => {
      const onBeforeRun = vi.fn();
      const onAfterRun = vi.fn();
      const directive = create(TestDirective);
      connect(directive);

      directive.effect(() => undefined, { onBeforeRun, onAfterRun });

      expect(onBeforeRun).toHaveBeenCalledOnce();
      expect(onAfterRun).toHaveBeenCalledOnce();
    });

    it('is disposed on disconnection', async () => {
      const state = new Signal.State(0);
      const spy = vi.fn();
      const onCleanup = vi.fn();
      const directive = create(TestDirective);
      directive.onInitSpy.mockImplementation(directive => {
        directive.effect(() => spy(state.get()), { onCleanup });
      });
      const context = connect(directive);

      expect(onCleanup).not.toHaveBeenCalled();
      clear(context);
      expect(onCleanup).toHaveBeenCalledOnce();

      state.set(1);
      await flush();
      expect(spy).toHaveBeenCalledOnce();
    });

    it('returns a disposer that stops the effect ahead of the disconnection', async () => {
      const state = new Signal.State(0);
      const spy = vi.fn();
      const onCleanup = vi.fn();
      const directive = create(TestDirective);
      connect(directive);

      const dispose = directive.effect(() => spy(state.get()), { onCleanup });
      dispose();
      state.set(1);
      await flush();

      expect(spy).toHaveBeenCalledOnce();
      expect(onCleanup).toHaveBeenCalledOnce();
    });

    it('is not disposed again on disconnection when its disposer was called', () => {
      const onCleanup = vi.fn();
      const directive = create(TestDirective);
      const context = connect(directive);

      directive.effect(() => undefined, { onCleanup })();
      clear(context);

      expect(onCleanup).toHaveBeenCalledOnce();
    });

    it('returns a disposer that throws when it is called a second time', () => {
      const directive = create(TestDirective);
      connect(directive);

      const dispose = directive.effect(() => undefined);
      dispose();

      expect(() => dispose()).toThrow();
    });

    it('returns a disposer that throws when it is called after the disconnection', () => {
      const state = new Signal.State(0);
      const directive = create(TestDirective);
      const context = connect(directive);

      const dispose = directive.effect(() => state.get());
      clear(context);

      expect(() => dispose()).toThrow();
    });

    describe('created before the connection', () => {
      it('can be created in the constructor and in a field initializer, and is disposed on disconnection', async () => {
        const state = new Signal.State(0);
        const runs = new Array<string>();
        const onCleanup = vi.fn();
        const directive = create(class extends TestDirective {
          public readonly stopField = this.effect(() => runs.push(`field ${state.get()}`), { onCleanup });

          constructor() {
            super();
            this.effect(() => runs.push(`constructor ${state.get()}`), { onCleanup });
          }
        });

        expect(runs).toEqual(['field 0', 'constructor 0']);
        const context = connect(directive);
        state.set(1);
        await flush();
        expect(runs).toEqual(['field 0', 'constructor 0', 'field 1', 'constructor 1']);

        clear(context);
        expect(onCleanup).toHaveBeenCalledTimes(2);
      });

      it('is disposed by its disposer before the connection, and not again on disconnection', () => {
        const onCleanup = vi.fn();
        const directive = create(TestDirective);

        directive.effect(() => undefined, { onCleanup })();
        clear(connect(directive));

        expect(onCleanup).toHaveBeenCalledOnce();
      });
    });

    it('only disposes the effect whose disposer is called', () => {
      const firstCleanup = vi.fn();
      const secondCleanup = vi.fn();
      const directive = create(TestDirective);
      const context = connect(directive);

      const disposeFirst = directive.effect(() => undefined, { onCleanup: firstCleanup });
      directive.effect(() => undefined, { onCleanup: secondCleanup });
      disposeFirst();

      expect(firstCleanup).toHaveBeenCalledOnce();
      expect(secondCleanup).not.toHaveBeenCalled();

      clear(context);
      expect(firstCleanup).toHaveBeenCalledOnce();
      expect(secondCleanup).toHaveBeenCalledOnce();
    });
  });

  describe('createComponent', () => {
    it('destroys the component on disconnection', () => {
      const directive = create(TestDirective);
      const context = connect(directive);
      const { element } = directive.createComponent(Child, { target: document.body });
      expect(element.isConnected).toBe(true);

      clear(context);

      expect(element.isConnected).toBe(false);
    });

    it('can be created before the connection, moving to the context of the element', () => {
      const directive = create(TestDirective);
      const { element, destroy } = directive.createComponent(Child, { target: document.body });
      const context = connect(directive);
      expect(childrenOf(context)).toHaveLength(1);

      destroy();

      expect(element.isConnected).toBe(false);
      expect(childrenOf(context)).toHaveLength(0);
    });

    describe('target', () => {
      it('is the element the directive is applied to when no options are given', () => {
        const host = document.createElement('div');
        const directive = create(TestDirective, host);
        connect(directive);

        const { element } = directive.createComponent(Child);

        expect(element.parentNode).toBe(host);
      });

      it('is the element the directive is applied to when the options have no target', () => {
        const host = document.createElement('div');
        const content = document.createTextNode('projected');
        const directive = create(TestDirective, host);
        connect(directive);

        const { element } = directive.createComponent(Child, { content: [content] });

        expect(element.parentNode).toBe(host);
        expect(element.contains(content)).toBe(true);
      });

      it('is the element the directive is applied to when the target is undefined', () => {
        const host = document.createElement('div');
        const directive = create(TestDirective, host);
        connect(directive);

        const { element } = directive.createComponent(Child, { target: undefined });

        expect(element.parentNode).toBe(host);
      });

      it('is the one of the options when it is given, leaving the options as they are', () => {
        const host = document.createElement('div');
        const target = document.createElement('section');
        const options = { target };
        const directive = create(TestDirective, host);
        connect(directive);

        const { element } = directive.createComponent(Child, options);

        expect(element.parentNode).toBe(target);
        expect(host.childNodes).toHaveLength(0);
        expect(options).toEqual({ target });
      });

      it('leaves the host without the component once it is destroyed', () => {
        const host = document.createElement('div');
        const directive = create(TestDirective, host);
        const context = connect(directive);
        directive.createComponent(Child);
        expect(host.childNodes).toHaveLength(1);

        clear(context);

        expect(host.childNodes).toHaveLength(0);
      });
    });
  });

  it('dispatches events on the element it is applied to', () => {
    const element = document.createElement('div');
    const listener = vi.fn();
    element.addEventListener('changed', listener);

    const event = new CustomEvent('changed');
    expect(create(TestDirective, element).dispatchEvent(event)).toBe(true);
    expect(listener).toHaveBeenCalledWith(event);
  });

  describe('exposed events', () => {
    /**
     * Builds a host directive exposing the given events, and listens to the events of its element.
     */
    function createHost(events: Array<[string, string]>) {
      const element = document.createElement('div');
      const directive = create(TestDirective, element);
      directive[SET_DIRECTIVE_EVENTS] = new Map(events);
      const listener = vi.fn();
      for (const name of ['changed', 'renamed', 'hidden']) {
        element.addEventListener(name, listener);
      }

      return { directive, listener };
    }

    it('dispatches an exposed event as it is', () => {
      const { directive, listener } = createHost([['changed', 'changed']]);
      const event = new CustomEvent('changed');

      expect(directive.dispatchEvent(event)).toBe(true);
      expect(listener).toHaveBeenCalledExactlyOnceWith(event);
    });

    it('dispatches an exposed event under the name it is exposed with, keeping what it carries', () => {
      const { directive, listener } = createHost([['changed', 'renamed']]);
      directive.dispatchEvent(new CustomEvent('changed', { detail: 7, bubbles: true, cancelable: true, composed: true }));

      const event: CustomEvent = listener.mock.calls[0][0];
      expect(listener).toHaveBeenCalledOnce();
      expect(event.type).toBe('renamed');
      expect(event.detail).toBe(7);
      expect([event.bubbles, event.cancelable, event.composed]).toEqual([true, true, true]);
    });

    it('does not dispatch an event it does not expose', () => {
      const { directive, listener } = createHost([['changed', 'changed']]);

      expect(directive.dispatchEvent(new CustomEvent('hidden'))).toBe(true);
      expect(listener).not.toHaveBeenCalled();
    });

    it('does not dispatch any event when it exposes none', () => {
      const { directive, listener } = createHost([]);
      directive.dispatchEvent(new CustomEvent('changed'));

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
