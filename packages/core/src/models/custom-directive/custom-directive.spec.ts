// @vitest-environment happy-dom
import { loadSignals } from '@xaendar/signals';
import { describe, expect, it, vi } from 'vitest';
import { DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT, SET_DIRECTIVE_ELEMENT, SET_DIRECTIVE_EVENTS } from '../../costants';
import { effect } from '../../signals/effect/effect';
import { _Context } from '../../utils/context/context.util';
import { CustomDirective } from './custom-directive';

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
  const context = new _Context({} as never);
  context.addUnlistener(() => directive[DIRECTIVE_DISCONNECT]());
  directive[DIRECTIVE_CONNECT](context);

  return context;
}

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

  it('can be connected and disconnected without onInit and onDestroy', () => {
    const directive = create(class extends CustomDirective { });

    expect(() => connect(directive).clear()).not.toThrow();
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

    connect(directive).clear();

    expect(calls).toEqual(['onDestroy', 'dispose']);
  });

  it('disposes its effects only once when disconnected twice', () => {
    const onCleanup = vi.fn();
    const directive = create(TestDirective);
    directive.onInitSpy.mockImplementation(directive => {
      directive.effect(() => undefined, { onCleanup });
    });
    const context = connect(directive);

    context.clear();
    context.clear();

    expect(onCleanup).toHaveBeenCalledOnce();
  });

  it('does not dispose on disconnection the effects created outside of the directive', () => {
    const onCleanup = vi.fn();
    const directive = create(TestDirective);
    directive.onInitSpy.mockImplementation(() => {
      effect(() => undefined, { onCleanup });
    });

    connect(directive).clear();

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
      context.clear();
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

    it('does not dispose the effect twice when the disposer is called before the disconnection', () => {
      const onCleanup = vi.fn();
      const directive = create(TestDirective);
      const context = connect(directive);

      const dispose = directive.effect(() => undefined, { onCleanup });
      dispose();
      dispose();
      context.clear();

      expect(onCleanup).toHaveBeenCalledOnce();
    });

    it('does not dispose the effect twice when the disposer is called after the disconnection', () => {
      const onCleanup = vi.fn();
      const directive = create(TestDirective);
      const context = connect(directive);

      const dispose = directive.effect(() => undefined, { onCleanup });
      context.clear();

      expect(() => dispose()).not.toThrow();
      expect(onCleanup).toHaveBeenCalledOnce();
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

      context.clear();
      expect(firstCleanup).toHaveBeenCalledOnce();
      expect(secondCleanup).toHaveBeenCalledOnce();
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
