import { afterEach, describe, expect, it, vi } from 'vitest';
import { queueWatcher } from './effect-queue.util';

/**
 * A watcher recording its calls, whose pending computed signal runs `run`.
 */
function fakeWatcher(run: () => void = () => undefined) {
  const pending = { get: vi.fn(run) };
  return { pending, watcher: { getPending: vi.fn(() => [pending]), watch: vi.fn() } as unknown as Signal.subtle.Watcher & { watch: ReturnType<typeof vi.fn> } };
}

/**
 * Runs `queueMicrotask` by hand, returning the tasks it was given.
 */
function captureMicrotasks(): Array<() => void> {
  const tasks = new Array<() => void>();
  vi.spyOn(globalThis, 'queueMicrotask').mockImplementation(task => { tasks.push(task); });
  return tasks;
}

describe('queueWatcher', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('evaluates the pending computed signals of the queued watchers in a single microtask, in order, re-arming each one', () => {
    const tasks = captureMicrotasks();
    const order = new Array<string>();
    const first = fakeWatcher(() => order.push('first'));
    const second = fakeWatcher(() => order.push('second'));

    queueWatcher.call(first.watcher);
    queueWatcher.call(second.watcher);
    expect(tasks).toHaveLength(1);
    tasks.shift()!();

    expect(order).toEqual(['first', 'second']);
    expect(first.watcher.watch).toHaveBeenCalledExactlyOnceWith();
  });

  it('runs in the same microtask the watchers queued while it runs, then schedules a new one for the next round', () => {
    const tasks = captureMicrotasks();
    const later = fakeWatcher();
    const first = fakeWatcher(() => queueWatcher.call(later.watcher));
    queueWatcher.call(first.watcher);

    tasks.shift()!();
    expect(later.pending.get).toHaveBeenCalledOnce();
    expect(tasks).toHaveLength(0);

    queueWatcher.call(later.watcher);
    expect(tasks).toHaveLength(1);
    tasks.shift()!();
    expect(later.pending.get).toHaveBeenCalledTimes(2);
  });

  it('rethrows the error of an effect, re-arming its watcher and running the ones after it in another microtask', () => {
    const tasks = captureMicrotasks();
    const failing = fakeWatcher(() => {
      throw new Error('boom');
    });
    const after = fakeWatcher();
    queueWatcher.call(failing.watcher);
    queueWatcher.call(after.watcher);

    expect(() => tasks.shift()!()).toThrow('boom');
    expect(failing.watcher.watch).toHaveBeenCalledOnce();
    expect(after.pending.get).not.toHaveBeenCalled();
    expect(tasks).toHaveLength(1);

    tasks.shift()!();
    expect(after.pending.get).toHaveBeenCalledOnce();
  });

  it('empties the queue when the last effect throws, so that the next watcher schedules a microtask', () => {
    const tasks = captureMicrotasks();
    queueWatcher.call(fakeWatcher(() => {
      throw new Error('boom');
    }).watcher);

    expect(() => tasks.shift()!()).toThrow('boom');
    expect(tasks).toHaveLength(0);

    queueWatcher.call(fakeWatcher().watcher);
    expect(tasks).toHaveLength(1);
    tasks.shift()!();
  });
});
