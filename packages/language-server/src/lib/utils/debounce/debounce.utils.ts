import type { NoArgsFunction } from '@xaendar/types';

/**
 * Debounces tasks independently by key, e.g. the validation of each template while the user is typing in it:
 * scheduling a task for a key cancels the one pending for the same key.
 */
export class Debouncer {
  /**
   * The timers of the pending tasks, keyed by their key.
   */
  private readonly _timers = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Creates a debouncer.
   *
   * @param _delay - The milliseconds a task waits before running.
   */
  constructor(private readonly _delay: number) { }

  /**
   * Schedules a task, cancelling the one pending for the same key.
   *
   * @param key - The key of the task.
   * @param task - The task.
   */
  public schedule(key: string, task: NoArgsFunction<unknown>): void {
    this.cancel(key);
    this._timers.set(key, setTimeout(() => {
      this._timers.delete(key);
      task();
    }, this._delay));
  }

  /**
   * Cancels the task pending for a key, if any.
   *
   * @param key - The key of the task.
   */
  public cancel(key: string): void {
    clearTimeout(this._timers.get(key));
    this._timers.delete(key);
  }

  /**
   * Cancels every pending task.
   */
  public dispose(): void {
    for (const timer of this._timers.values()) {
      clearTimeout(timer);
    }

    this._timers.clear();
  }
}
