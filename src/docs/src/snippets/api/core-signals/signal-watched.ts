import { signal } from '@xaendar/core/signals';

/**
 * Whether the page is visible, followed only while something depends on it.
 */
const visible = signal(document.visibilityState === 'visible', {
  watched: () => {
    document.addEventListener('visibilitychange', refresh);
    queueMicrotask(refresh); // signals are frozen here: the write is deferred
  },
  unwatched: () => document.removeEventListener('visibilitychange', refresh)
});

/**
 * Copies the visibility of the page into the signal.
 */
function refresh(): void {
  visible.set(document.visibilityState === 'visible');
}
