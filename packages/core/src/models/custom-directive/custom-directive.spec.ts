// @vitest-environment happy-dom
import { loadSignals } from '@xaendar/signals';
import { describe, expect, it, vi } from 'vitest';
import { DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT } from '../../costants';
import { effect } from '../../signals/effect/effect';
import { CustomDirective } from './custom-directive';

loadSignals();

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

class TestDirective extends CustomDirective {
  public readonly reactToChangesSpy = vi.fn<() => Array<() => void> | undefined>();

  public onInit(): Array<() => void> | undefined {
    return this.reactToChangesSpy();
  }
}

describe('CustomDirective', () => {
  it('does not react to changes until it is connected', () => {
    const directive = new TestDirective(document.createElement('div'));

    expect(directive.reactToChangesSpy).not.toHaveBeenCalled();
  });

  it('reacts to changes when connected', () => {
    const directive = new TestDirective(document.createElement('div'));
    directive[DIRECTIVE_CONNECT]();

    expect(directive.reactToChangesSpy).toHaveBeenCalledOnce();
  });

  it('can be connected and disconnected without onInit and onDestroy', () => {
    const directive = new (class extends CustomDirective { })(document.createElement('div'));

    expect(() => {
      directive[DIRECTIVE_CONNECT]();
      directive[DIRECTIVE_DISCONNECT]();
    }).not.toThrow();
  });

  it('invokes the unlisten functions returned by onInit when disconnected', () => {
    const directive = new TestDirective(document.createElement('div'));
    const unlisten = vi.fn();
    directive.reactToChangesSpy.mockReturnValue([unlisten]);
    directive[DIRECTIVE_CONNECT]();

    expect(unlisten).not.toHaveBeenCalled();
    directive[DIRECTIVE_DISCONNECT]();
    expect(unlisten).toHaveBeenCalledOnce();
  });

  it('invokes the unlisten functions only once when disconnected twice', () => {
    const directive = new TestDirective(document.createElement('div'));
    const unlisten = vi.fn();
    directive.reactToChangesSpy.mockReturnValue([unlisten]);
    directive[DIRECTIVE_CONNECT]();

    directive[DIRECTIVE_DISCONNECT]();
    directive[DIRECTIVE_DISCONNECT]();

    expect(unlisten).toHaveBeenCalledOnce();
  });

  it('can be disposed when onInit returns no unlisten function', () => {
    const directive = new TestDirective(document.createElement('div'));
    directive[DIRECTIVE_CONNECT]();

    expect(() => directive[DIRECTIVE_DISCONNECT]()).not.toThrow();
  });

  it('invokes onDestroy after the unlisten functions when disconnected', () => {
    const calls = new Array<string>();
    const directive = new (class extends TestDirective {
      public onDestroy(): void {
        calls.push('onDestroy');
      }
    })(document.createElement('div'));
    directive.reactToChangesSpy.mockReturnValue([() => calls.push('unlisten')]);
    directive[DIRECTIVE_CONNECT]();

    directive[DIRECTIVE_DISCONNECT]();

    expect(calls).toEqual(['unlisten', 'onDestroy']);
  });

  it('does not dispose on disconnection the effects created outside of the directive', () => {
    const onCleanup = vi.fn();
    const directive = new TestDirective(document.createElement('div'));
    directive.reactToChangesSpy.mockImplementation(() => {
      effect(() => undefined, { onCleanup });
      return undefined;
    });
    directive[DIRECTIVE_CONNECT]();

    directive[DIRECTIVE_DISCONNECT]();

    expect(onCleanup).not.toHaveBeenCalled();
  });

  describe('effect', () => {
    it('runs immediately and re-runs when a tracked signal changes', async () => {
      const state = new Signal.State(0);
      const spy = vi.fn();
      const directive = new TestDirective(document.createElement('div'));

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
      const directive = new TestDirective(document.createElement('div'));

      directive.effect(() => undefined, { onBeforeRun, onAfterRun });

      expect(onBeforeRun).toHaveBeenCalledOnce();
      expect(onAfterRun).toHaveBeenCalledOnce();
    });

    it('is disposed on disconnection', async () => {
      const state = new Signal.State(0);
      const spy = vi.fn();
      const onCleanup = vi.fn();
      const directive = new TestDirective(document.createElement('div'));
      directive.reactToChangesSpy.mockImplementation(() => {
        directive.effect(() => spy(state.get()), { onCleanup });
        return undefined;
      });
      directive[DIRECTIVE_CONNECT]();

      expect(onCleanup).not.toHaveBeenCalled();
      directive[DIRECTIVE_DISCONNECT]();
      expect(onCleanup).toHaveBeenCalledOnce();

      state.set(1);
      await flush();
      expect(spy).toHaveBeenCalledOnce();
    });

    it('returns a disposer that stops the effect ahead of the disconnection', async () => {
      const state = new Signal.State(0);
      const spy = vi.fn();
      const onCleanup = vi.fn();
      const directive = new TestDirective(document.createElement('div'));

      const dispose = directive.effect(() => spy(state.get()), { onCleanup });
      dispose();
      state.set(1);
      await flush();

      expect(spy).toHaveBeenCalledOnce();
      expect(onCleanup).toHaveBeenCalledOnce();
    });

    it('does not dispose the effect twice when the disposer is called before the disconnection', () => {
      const onCleanup = vi.fn();
      const directive = new TestDirective(document.createElement('div'));

      const dispose = directive.effect(() => undefined, { onCleanup });
      dispose();
      dispose();
      directive[DIRECTIVE_DISCONNECT]();

      expect(onCleanup).toHaveBeenCalledOnce();
    });

    it('does not dispose the effect twice when the disposer is called after the disconnection', () => {
      const onCleanup = vi.fn();
      const directive = new TestDirective(document.createElement('div'));

      const dispose = directive.effect(() => undefined, { onCleanup });
      directive[DIRECTIVE_DISCONNECT]();

      expect(() => dispose()).not.toThrow();
      expect(onCleanup).toHaveBeenCalledOnce();
    });

    it('does not dispose the effect twice when its disposer is also returned by onInit', () => {
      const onCleanup = vi.fn();
      const directive = new TestDirective(document.createElement('div'));
      directive.reactToChangesSpy.mockImplementation(() => [directive.effect(() => undefined, { onCleanup })]);
      directive[DIRECTIVE_CONNECT]();

      expect(() => directive[DIRECTIVE_DISCONNECT]()).not.toThrow();
      expect(onCleanup).toHaveBeenCalledOnce();
    });

    it('only disposes the effect whose disposer is called', () => {
      const firstCleanup = vi.fn();
      const secondCleanup = vi.fn();
      const directive = new TestDirective(document.createElement('div'));

      const disposeFirst = directive.effect(() => undefined, { onCleanup: firstCleanup });
      directive.effect(() => undefined, { onCleanup: secondCleanup });
      disposeFirst();

      expect(firstCleanup).toHaveBeenCalledOnce();
      expect(secondCleanup).not.toHaveBeenCalled();

      directive[DIRECTIVE_DISCONNECT]();
      expect(firstCleanup).toHaveBeenCalledOnce();
      expect(secondCleanup).toHaveBeenCalledOnce();
    });
  });

  it('dispatches events on the element it is applied to', () => {
    const element = document.createElement('div');
    const listener = vi.fn();
    element.addEventListener('changed', listener);

    const event = new CustomEvent('changed');
    expect(new TestDirective(element).dispatchEvent(event)).toBe(true);
    expect(listener).toHaveBeenCalledWith(event);
  });
});
