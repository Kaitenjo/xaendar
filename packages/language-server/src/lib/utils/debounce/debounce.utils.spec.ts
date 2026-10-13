import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Debouncer } from './debounce.utils';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Debouncer', () => {
  it('runs a task once its delay has passed since the last scheduling for the same key', () => {
    const debouncer = new Debouncer(100);
    const first = vi.fn();
    const second = vi.fn();

    debouncer.schedule('a', first);
    vi.advanceTimersByTime(50);
    debouncer.schedule('a', second);
    vi.advanceTimersByTime(99);
    expect(second).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('debounces each key independently', () => {
    const debouncer = new Debouncer(100);
    const first = vi.fn();
    const second = vi.fn();

    debouncer.schedule('a', first);
    debouncer.schedule('b', second);
    vi.advanceTimersByTime(100);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('cancels the task of a key, or every task', () => {
    const debouncer = new Debouncer(100);
    const tasks = [vi.fn(), vi.fn(), vi.fn()];

    debouncer.schedule('a', tasks[0]);
    debouncer.schedule('b', tasks[1]);
    debouncer.schedule('c', tasks[2]);
    debouncer.cancel('a');
    debouncer.cancel('missing');
    vi.advanceTimersByTime(50);
    debouncer.dispose();
    vi.advanceTimersByTime(100);

    tasks.forEach(task => expect(task).not.toHaveBeenCalled());
  });
});
