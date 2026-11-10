import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Effect } from '../../types/effect.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { createEffect } = await import('./effect');

/**
 * Waits for the microtask running the queued effects, and for the ones it schedules.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Runs `queueMicrotask` by hand, returning the tasks it was given.
 */
function captureMicrotasks(): Array<() => void> {
  const tasks = new Array<() => void>();
  vi.spyOn(globalThis, 'queueMicrotask').mockImplementation(task => { tasks.push(task); });
  return tasks;
}

describe('createEffect', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('first run (rule 4)', () => {
    it('runs the callback synchronously, with its three arguments', () => {
      const callback = vi.fn();
      createEffect(callback, undefined, 'a', 2, true);
      expect(callback).toHaveBeenCalledExactlyOnceWith('a', 2, true);
    });

    it('is the computed signal its callback runs in, depending on the signals the callback reads', () => {
      const state = new Signal.State(1);
      const effect = createEffect(() => state.get());

      expect(effect).toBeInstanceOf(Signal.Computed);
      expect(Signal.subtle.introspectSources(effect)).toEqual([state]);
      expect(Signal.subtle.hasSinks(state)).toBe(true);
    });

    it('is torn down and rethrows when the first run throws, without calling onCleanup', async () => {
      const state = new Signal.State(0);
      const callback = vi.fn(() => {
        state.get();
        throw new Error('boom');
      });
      const onCleanup = vi.fn();

      expect(() => createEffect(callback, { onCleanup })).toThrow('boom');
      expect(Signal.subtle.hasSinks(state)).toBe(false);

      state.set(1);
      await flush();
      expect(callback).toHaveBeenCalledOnce();
      expect(onCleanup).not.toHaveBeenCalled();
    });
  });

  describe('re-runs', () => {
    it('runs once however many times it is notified before it runs (rule 2)', async () => {
      const first = new Signal.State(0);
      const second = new Signal.State(0);
      const callback = vi.fn(() => first.get() + second.get());
      createEffect(callback);

      first.set(1);
      second.set(1);
      first.set(2);
      await flush();

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('runs the effects in the order they were notified, in a single microtask (rule 2)', async () => {
      const states = [new Signal.State(0), new Signal.State(0), new Signal.State(0)];
      const order = new Array<number>();
      for (let i = 0; i < states.length; i++) {
        createEffect((index: number) => {
          if (states[index].get()) {
            order.push(index);
          }
        }, undefined, i);
      }

      const queueSpy = vi.spyOn(globalThis, 'queueMicrotask');
      states[2].set(1);
      states[0].set(1);
      states[1].set(1);
      expect(queueSpy).toHaveBeenCalledOnce();
      queueSpy.mockRestore();
      await flush();

      expect(order).toEqual([2, 0, 1]);
    });

    it('runs, in the same round, an effect notified while the queue runs by a signal another effect writes (rule 1)', async () => {
      const source = new Signal.State(0);
      const derived = new Signal.State(0);
      const seen = new Array<number>();
      createEffect(() => derived.set(source.get() * 10));
      createEffect(() => seen.push(derived.get()));

      source.set(1);
      await Promise.resolve();

      expect(seen).toEqual([0, 10]);
    });

    it('runs with the last values an effect whose signals another effect writes while it is queued (rule 1)', async () => {
      const source = new Signal.State(0);
      const shared = new Signal.State(0);
      const seen = new Array<number>();
      createEffect(() => {
        if (source.get()) {
          shared.set(source.get());
        }
      });
      createEffect(() => seen.push(shared.get() + source.get()));

      source.set(5);
      await flush();

      expect(seen).toEqual([0, 10]);
    });

    it('is not notified by the writes of its own run to the signals it reads, as with a computed signal', async () => {
      const count = new Signal.State(0);
      const callback = vi.fn(() => {
        count.set(count.get() + 1);
      });
      createEffect(callback);
      await flush();
      expect(callback).toHaveBeenCalledOnce();

      count.set(10);
      await flush();
      expect(callback).toHaveBeenCalledTimes(2);
      expect(count.get()).toBe(11);
    });

    it('does not run when the computed signals it read keep their value, and runs when one changes', async () => {
      const source = new Signal.State(1);
      const parity = new Signal.Computed(() => source.get() % 2);
      const callback = vi.fn(() => parity.get());
      createEffect(callback);

      source.set(3);
      await flush();
      expect(callback).toHaveBeenCalledOnce();

      source.set(4);
      await flush();
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('errors (rule 3)', () => {
    it('rethrows the error of a run from the microtask, and runs the effects after it in another one', () => {
      const tasks = captureMicrotasks();
      const state = new Signal.State(0);
      const after = vi.fn(() => state.get());
      createEffect(() => {
        if (state.get()) {
          throw new Error('boom');
        }
      });
      createEffect(after);

      state.set(1);
      expect(() => tasks.shift()!()).toThrow('boom');
      expect(after).toHaveBeenCalledOnce();
      expect(tasks).toHaveLength(1);

      tasks.shift()!();
      expect(after).toHaveBeenCalledTimes(2);
      expect(tasks).toHaveLength(0);
    });

    it('keeps running after a run throws', () => {
      const tasks = captureMicrotasks();
      const state = new Signal.State(0);
      const callback = vi.fn(() => {
        if (state.get()) {
          throw new Error('boom');
        }
      });
      createEffect(callback);

      state.set(1);
      expect(() => tasks.shift()!()).toThrow('boom');
      expect(tasks).toHaveLength(0);
      state.set(2);
      expect(() => tasks.shift()!()).toThrow('boom');
      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe('options (rule 5)', () => {
    it('calls onBeforeRun and onAfterRun around each run, without tracking what they read', async () => {
      const state = new Signal.State(0);
      const hooked = new Signal.State(0);
      const order = new Array<string>();
      createEffect(() => order.push(`run ${state.get()}`), {
        onBeforeRun: () => order.push(`before ${hooked.get()}`),
        onAfterRun: () => order.push(`after ${hooked.get()}`)
      });

      hooked.set(1);
      await flush();
      state.set(1);
      await flush();

      expect(order).toEqual(['before 0', 'run 0', 'after 0', 'before 1', 'run 1', 'after 1']);
    });

    it('calls onAfterRun also when the run throws', () => {
      const onAfterRun = vi.fn();
      expect(() => createEffect(() => {
        throw new Error('boom');
      }, { onAfterRun })).toThrow('boom');
      expect(onAfterRun).toHaveBeenCalledOnce();
    });
  });

  describe('dispose (rule 5)', () => {
    it('calls onCleanup, stops depending on its signals and never runs again, also when it is queued', async () => {
      const state = new Signal.State(0);
      const callback = vi.fn(() => state.get());
      const onCleanup = vi.fn();
      const effect = createEffect(callback, { onCleanup });

      state.set(1);
      effect.dispose();
      await flush();

      expect(onCleanup).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledOnce();
      expect(Signal.subtle.hasSinks(state)).toBe(false);
    });

    it('throws when it is already disposed', () => {
      const effect = createEffect(() => undefined);
      effect.dispose();
      expect(() => effect.dispose()).toThrow();
    });

    it('does not run when another effect of the same round disposes it before its turn', async () => {
      const state = new Signal.State(0);
      const disposed = vi.fn(() => state.get());
      let target: Effect | undefined = undefined;
      createEffect(() => {
        if (state.get()) {
          target!.dispose();
        }
      });
      target = createEffect(disposed);

      state.set(1);
      await flush();

      expect(disposed).toHaveBeenCalledOnce();
    });

    it('stops depending on its signals when disposed during its own run', async () => {
      const state = new Signal.State(0);
      const holder: { effect?: Effect } = {};
      const callback = vi.fn(() => {
        if (state.get()) {
          holder.effect!.dispose();
        }
      });
      holder.effect = createEffect(callback);

      state.set(1);
      await flush();
      state.set(2);
      await flush();

      expect(callback).toHaveBeenCalledTimes(2);
      expect(Signal.subtle.hasSinks(state)).toBe(false);
    });
  });

  describe('nested effects (rule 6)', () => {
    it('runs an effect created inside a run on its own: its re-runs, whose value is always undefined, do not re-run the outer effect', async () => {
      const outerState = new Signal.State(0);
      const innerState = new Signal.State(0);
      const inner = vi.fn(() => innerState.get());
      const holder: { created?: Effect } = {};
      const outerCallback = vi.fn(() => {
        outerState.get();
        holder.created ??= createEffect(inner);
      });
      const outer = createEffect(outerCallback);

      expect(Signal.subtle.introspectSources(outer)).toContain(outerState);
      expect(Signal.subtle.introspectSources(holder.created!)).toEqual([innerState]);

      innerState.set(1);
      await flush();
      expect(inner).toHaveBeenCalledTimes(2);
      expect(outerCallback).toHaveBeenCalledOnce();
    });

    it('runs an effect created while the queue runs, and notified in the same round', async () => {
      const trigger = new Signal.State(0);
      const later = new Signal.State(0);
      const seen = new Array<number>();
      createEffect(() => {
        if (trigger.get()) {
          createEffect(() => seen.push(later.get()));
          later.set(1);
        }
      });

      trigger.set(1);
      await Promise.resolve();

      expect(seen).toEqual([0, 1]);
    });
  });

  it('defines its class once, shared by every effect', () => {
    const first = createEffect(() => undefined);
    const second = createEffect(() => undefined);
    expect(Object.getPrototypeOf(first)).toBe(Object.getPrototypeOf(second));
  });
});
