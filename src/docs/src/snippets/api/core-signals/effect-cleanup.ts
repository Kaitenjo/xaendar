import { effect, signal } from '@xaendar/core/signals';

/**
 * The text to search for.
 */
const query = signal('');
/**
 * The search scheduled by the last run.
 */
let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * Searches 300 ms after the last change of the text.
 */
const dispose = effect(() => {
  clearTimeout(timer);                       // the cleanup of the previous run, at the start of this one
  const text = query();
  timer = setTimeout(() => search(text), 300);
}, {
  onCleanup: () => clearTimeout(timer)       // once, when the effect is disposed
});

dispose();
