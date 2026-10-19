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
    // Nothing depends on the clock any more: the timer stops until watched runs again
    clearInterval(timer);
    timer = undefined;
  }
});
