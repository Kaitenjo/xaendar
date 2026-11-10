import type { NoArgsVoidFunction } from '@xaendar/types';

/**
 * What a context runs when it is cleared: a function, called, or an object, disposed with its `dispose()`, as an effect,
 * which is registered so without a closure calling it.
 *
 * N.B. Deliberate, to save memory: every binding of a template registers its effect here, so accepting the effect
 * itself, instead of only functions, saves a `() => effect.dispose()` per binding, tens of thousands in a large
 * template. Do not narrow it back to functions. The public `effect()` still returns a function.
 */
export type Unlistener = NoArgsVoidFunction | { dispose(): void };
