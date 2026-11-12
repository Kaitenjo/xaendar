import { loadSignals } from '@xaendar/signals';
import { describe, expect, it, vi } from 'vitest';
import { _scope, clear, EMPTY_LAYOUT, refresh, update } from '../../utils/context/context.util';
import type { _Context } from '../../types/context.type';
import { _bindEffect, effect } from './effect';
import { CLEANUP, HEADER } from '../../costants';
import type { _ScopeLayout } from '../../types/scope-layout.type';

/**
 * The layout of a scope declaring `row`.
 */
const ROW_LAYOUT: _ScopeLayout = { size: HEADER + 1, nodes: HEADER + 1, variables: ['row'] };

loadSignals();

/**
 * Helper: flushes the microtask queue so that scheduled effect
 * re-runs are executed synchronously within the test.
 */
const flushMicrotasks = () => new Promise<void>(resolve => queueMicrotask(resolve));

describe('effect', () => {

  describe('initial execution', () => {
    it('runs the callback synchronously on creation', () => {
      const spy = vi.fn();
      effect(spy);
      expect(spy).toHaveBeenCalledOnce();
    });

    it('reads the current value of tracked signals', () => {
      const state = new Signal.State(42);
      let captured: number | undefined;

      effect(() => { captured = state.get(); });

      expect(captured).toBe(42);
    });
  });

  describe('reactivity', () => {
    it('re-runs when a tracked signal changes', async () => {
      const state = new Signal.State(0);
      const spy = vi.fn();

      effect(() => { spy(state.get()); });
      expect(spy).toHaveBeenCalledWith(0);

      state.set(1);
      await flushMicrotasks();

      expect(spy).toHaveBeenCalledWith(1);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('batches multiple synchronous updates into a single re-run', async () => {
      const state = new Signal.State(0);
      const spy = vi.fn();

      effect(() => { spy(state.get()); });

      state.set(1);
      state.set(2);
      state.set(3);
      await flushMicrotasks();

      // Only 2 calls total: initial + one batched re-run
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(3);
    });

    it('schedules a single re-run when notified more than once before it', async () => {
      const source = new Signal.State(0);
      const derived = new Signal.Computed(() => source.get() * 2);
      const direct = new Signal.State(0);
      const onBeforeRun = vi.fn();
      const spy = vi.fn();

      effect(() => { spy(derived.get() + direct.get()); }, { onBeforeRun });

      source.set(1); // the effect becomes ~checked~: first notification
      direct.set(1); // then ~dirty~: second notification, already scheduled
      await flushMicrotasks();

      expect(onBeforeRun).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith(3);
    });

    it('tracks multiple signals', async () => {
      const greeting = new Signal.State('hello');
      const subject = new Signal.State('world');
      const spy = vi.fn();

      effect(() => { spy(`${greeting.get()} ${subject.get()}`); });
      expect(spy).toHaveBeenCalledWith('hello world');

      greeting.set('ciao');
      await flushMicrotasks();
      expect(spy).toHaveBeenCalledWith('ciao world');

      subject.set('mondo');
      await flushMicrotasks();
      expect(spy).toHaveBeenCalledWith('ciao mondo');
    });

    it('re-tracks dependencies on each run (dynamic deps)', async () => {
      const toggle = new Signal.State(true);
      const primary = new Signal.State('A');
      const fallback = new Signal.State('B');
      const spy = vi.fn();

      effect(() => {
        spy(toggle.get() ? primary.get() : fallback.get());
      });
      expect(spy).toHaveBeenLastCalledWith('A');

      // Change fallback — should NOT trigger because fallback is not tracked
      fallback.set('B2');
      await flushMicrotasks();
      expect(spy).toHaveBeenCalledTimes(1);

      // Switch branch — now fallback is tracked, primary is not
      toggle.set(false);
      await flushMicrotasks();
      expect(spy).toHaveBeenLastCalledWith('B2');

      // Change primary — should NOT trigger
      primary.set('A2');
      await flushMicrotasks();
      expect(spy).toHaveBeenCalledTimes(2); // initial + toggle switch
    });

    it('does not re-run when set to the same value (equality check)', async () => {
      const state = new Signal.State(1);
      const spy = vi.fn();

      effect(() => { spy(state.get()); });

      state.set(1); // same value
      await flushMicrotasks();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('errors', () => {
    it('rethrows on creation and stops watching', async () => {
      const state = new Signal.State(0);
      const spy = vi.fn();
      const onAfterRun = vi.fn();

      expect(() => effect(() => {
        spy(state.get());
        throw new Error('boom');
      }, { onAfterRun })).toThrow('boom');
      expect(onAfterRun).toHaveBeenCalledOnce();

      state.set(1);
      await flushMicrotasks();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('rethrows from a re-run and keeps re-running', () => {
      // The re-runs are executed by hand, so that their exceptions can be asserted
      const tasks: (() => void)[] = [];
      const queueSpy = vi.spyOn(globalThis, 'queueMicrotask').mockImplementation(task => { tasks.push(task); });

      try {
        const state = new Signal.State(0);
        const spy = vi.fn();
        const onAfterRun = vi.fn();

        effect(() => {
          spy(state.get());
          if (state.get() > 0) {
            throw new Error('boom');
          }
        }, { onAfterRun });

        state.set(1);
        expect(() => tasks.shift()?.()).toThrow('boom');
        expect(onAfterRun).toHaveBeenCalledTimes(2);

        state.set(2);
        expect(() => tasks.shift()?.()).toThrow('boom');
        expect(spy.mock.calls).toEqual([[0], [1], [2]]);
        // A run that throws does not schedule another one with nothing pending
        expect(tasks).toHaveLength(0);
      } finally {
        queueSpy.mockRestore();
      }
    });
  });

  describe('options', () => {

    describe('onBeforeRun', () => {
      it('is called before the initial execution', () => {
        const order: string[] = [];
        effect(
          () => { order.push('fn'); },
          { onBeforeRun: () => order.push('before') }
        );
        expect(order).toEqual(['before', 'fn']);
      });

      it('is called before each re-run', async () => {
        const state = new Signal.State(0);
        const order: string[] = [];

        effect(
          () => { order.push(`fn(${state.get()})`); },
          { onBeforeRun: () => order.push('before') }
        );

        order.length = 0; // ignore initial run
        state.set(1);
        await flushMicrotasks();

        expect(order).toEqual(['before', 'fn(1)']);
      });
    });

    describe('onAfterRun', () => {
      it('does not schedule a re-run right after the initial execution', async () => {
      const onAfterRun = vi.fn();

      effect(() => {}, { onAfterRun });
      await flushMicrotasks();

      expect(onAfterRun).toHaveBeenCalledOnce();
    });

    it('is called after the initial execution', () => {
        const order: string[] = [];
        effect(
          () => { order.push('fn'); },
          { onAfterRun: () => order.push('after') }
        );
        expect(order).toEqual(['fn', 'after']);
      });

      it('is called after each re-run', async () => {
        const state = new Signal.State(0);
        const order: string[] = [];

        effect(
          () => { order.push(`fn(${state.get()})`); },
          { onAfterRun: () => order.push('after') }
        );

        order.length = 0; // ignore initial run
        state.set(1);
        await flushMicrotasks();

        expect(order).toEqual(['fn(1)', 'after']);
      });
    });

    describe('onBeforeRun + onAfterRun together', () => {
      it('wraps each run with before and after hooks in the correct order', async () => {
        const state = new Signal.State(0);
        const order: string[] = [];

        effect(
          () => { order.push(`fn(${state.get()})`); },
          {
            onBeforeRun: () => order.push('before'),
            onAfterRun: () => order.push('after'),
          }
        );

        expect(order).toEqual(['before', 'fn(0)', 'after']);

        order.length = 0;
        state.set(1);
        await flushMicrotasks();

        expect(order).toEqual(['before', 'fn(1)', 'after']);
      });

      it('are not called when fn does not run, because the computed signal it reads kept its value', async () => {
        const source = new Signal.State(1);
        const parity = new Signal.Computed(() => source.get() % 2);
        const order: string[] = [];

        effect(
          () => { order.push(`fn(${parity.get()})`); },
          {
            onBeforeRun: () => order.push('before'),
            onAfterRun: () => order.push('after'),
          }
        );

        order.length = 0;
        source.set(3);
        await flushMicrotasks();

        expect(order).toEqual([]);
      });

      it('are not called by a run scheduled before the effect is disposed', async () => {
        const state = new Signal.State(0);
        const onBeforeRun = vi.fn();
        const onAfterRun = vi.fn();
        const dispose = effect(() => { state.get(); }, { onBeforeRun, onAfterRun });

        state.set(1);
        dispose();
        await flushMicrotasks();

        expect(onBeforeRun).toHaveBeenCalledOnce();
        expect(onAfterRun).toHaveBeenCalledOnce();
      });

      it('do not make the signals they read dependencies of the effect', async () => {
        const state = new Signal.State(0);
        const read = new Signal.State(0);
        const spy = vi.fn();

        effect(
          () => { spy(state.get()); },
          {
            onBeforeRun: () => { read.get(); },
            onAfterRun: () => { read.get(); },
          }
        );

        read.set(1);
        await flushMicrotasks();

        expect(spy).toHaveBeenCalledOnce();
      });
    });

    describe('onCleanup', () => {
      it('is called when the disposer is invoked', () => {
        const spy = vi.fn();
        const dispose = effect(() => {}, { onCleanup: spy });

        expect(spy).not.toHaveBeenCalled();
        dispose();
        expect(spy).toHaveBeenCalledOnce();
      });

      it('is not called before disposal', async () => {
        const state = new Signal.State(0);
        const spy = vi.fn();

        const dispose = effect(() => { state.get(); }, { onCleanup: spy });
        state.set(1);
        await flushMicrotasks();

        expect(spy).not.toHaveBeenCalled();

        dispose();
        expect(spy).toHaveBeenCalledOnce();
      });
    });
  });

  describe('disposal', () => {
    it('returns a disposer function', () => {
      const dispose = effect(() => {});
      expect(typeof dispose).toBe('function');
    });

    it('stops re-running after disposal', async () => {
      const state = new Signal.State(0);
      const spy = vi.fn();

      const dispose = effect(() => { spy(state.get()); });
      expect(spy).toHaveBeenCalledTimes(1);

      dispose();

      state.set(1);
      await flushMicrotasks();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('throws if called multiple times (already unwatched)', () => {
      const dispose = effect(() => {});
      dispose();
      expect(() => dispose()).toThrow();
    });
  });
});

describe('_bindEffect', () => {
  it('keeps nothing for a binding reading neither a signal nor a variable of the template', () => {
    const context = _scope(null, EMPTY_LAYOUT);
    const callback = vi.fn();
    _bindEffect(context, callback, 'value');

    expect(callback).toHaveBeenCalledExactlyOnceWith('value', undefined, undefined);
    expect(context[CLEANUP]).toBeNull();
  });

  it('registers in the context a binding reading variables of the template, without an effect when it reads no signal', () => {
    const context = _scope(null, ROW_LAYOUT);
    context[HEADER] = 'a';
    const seen = new Array<unknown>();
    const callback = (scope: _Context) => { seen.push(scope[HEADER]); };
    _bindEffect(context, callback, context, undefined, undefined, [0]);

    update(context, HEADER, 'b');
    refresh(context, [0]);

    expect(seen).toEqual(['a', 'b']);
    expect(context[CLEANUP]).toMatchObject({ reads: [0], effect: null });
  });

  it('makes a binding reading a variable and a signal an effect too, running again for both, disposed with the context', async () => {
    const context = _scope(null, ROW_LAYOUT);
    context[HEADER] = 'a';
    const state = new Signal.State(1);
    const seen = new Array<string>();
    _bindEffect(context, (scope: _Context, source: Signal.State<number>) => { seen.push(`${String(scope[HEADER])}${source.get()}`); }, context, state, undefined, [0]);

    state.set(2);
    await flushMicrotasks();
    update(context, HEADER, 'b');
    refresh(context, [0]);
    clear(context);
    state.set(3);
    await flushMicrotasks();

    expect(seen).toEqual(['a1', 'a2', 'b2']);
    expect(Signal.subtle.hasSinks(state)).toBe(false);
  });

  it('runs the callback with its arguments, again when a signal it read changes, and is disposed with the context', async () => {
    const context = _scope(null, EMPTY_LAYOUT);
    const state = new Signal.State(1);
    const seen: Array<[string, number]> = [];
    _bindEffect(context, (label: string, source: Signal.State<number>) => { seen.push([label, source.get()]); }, 'value', state);

    state.set(2);
    await flushMicrotasks();
    clear(context);
    state.set(3);
    await flushMicrotasks();

    expect(seen).toEqual([['value', 1], ['value', 2]]);
    expect(Signal.subtle.hasSinks(state)).toBe(false);
  });
});
