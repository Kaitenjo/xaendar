import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `effect-api.ts`, shown by the page signals/effects.
 */
export const EFFECT_API: SourceFile = {
  name: 'effect-api.ts',
  lang: 'ts',
  code: `import { effect } from '@xaendar/core/signals';

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

dispose();`
};

/**
 * The snippet `infinite-loop.ts`, shown by the API reference of core-signals and the page signals/effects.
 */
export const INFINITE_LOOP: SourceFile = {
  name: 'infinite-loop.ts',
  lang: 'ts',
  code: `// ✗ The effect reads count and writes it: every run schedules another one, forever.
//   The microtask queue never empties and the page freezes.
this.effect(() => {
  this.count.set(this.count() + 1);
});

// ✓ update() reads the previous value without tracking it: the effect does not depend on count.
this.effect(() => {
  this.log.update(log => [...log, \`seen \${this.other()}\`]);
});`
};
