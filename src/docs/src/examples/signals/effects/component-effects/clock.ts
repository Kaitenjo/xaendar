import { signal } from '@xaendar/core/signals';

/**
 * Elapsed seconds. The interval only runs while something depends on the signal.
 */
export const seconds = signal(0, {
  watched: () => {
    interval = setInterval(() => seconds.update(value => value + 1), 1000);
  },
  unwatched: () => {
    clearInterval(interval);
  }
});

/**
 * The interval updating `seconds`.
 */
let interval: ReturnType<typeof setInterval> | undefined;

/**
 * What the effects logged, most recent first.
 */
export const log = signal<Array<{ id: number; text: string }>>([]);

/**
 * The id of the next line of the log.
 */
let nextId = 0;

/**
 * Logs a line.
 *
 * @param text - The line.
 */
export function write(text: string): void {
  log.update(lines => [{ id: nextId++, text }, ...lines].slice(0, 6));
}

/**
 * The disposers of the standalone effects created by the child components.
 */
export const leaked: Array<() => void> = [];
