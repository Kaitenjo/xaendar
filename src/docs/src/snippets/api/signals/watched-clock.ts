import { signal } from '@xaendar/core/signals';

/**
 * The timer refreshing the clock, while something depends on it.
 */
let timer: ReturnType<typeof setInterval> | undefined;

/**
 * The current time, refreshed every second only while something depends on it.
 */
export const now = signal(new Date(), {
  watched() {
    // Signals are frozen here: the timer writes later, never during the callback
    timer ??= setInterval(() => now.set(new Date()), 1000);
  },
  unwatched() {
    // A new evaluation of the only computed signal reading the clock runs unwatched, then watched again:
    // the timer stops only if nothing depends on the clock once the graph is updated
    queueMicrotask(() => {
      if (!Signal.subtle.hasSinks(this)) {
        clearInterval(timer);
        timer = undefined;
      }
    });
  }
});
