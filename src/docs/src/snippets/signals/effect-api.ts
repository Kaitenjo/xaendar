import { effect } from '@xaendar/core/signals';

/**
 * Stops the effect for good when called.
 */
const dispose = effect(() => {
  console.log('count is', count());   // runs now, then after every change of count
}, {
  onBeforeRun: () => {},             // before every run, the first one included
  onAfterRun: () => {},              // after every run, even when it throws
  onCleanup: () => {}                // once, when the effect is disposed
});

dispose();
