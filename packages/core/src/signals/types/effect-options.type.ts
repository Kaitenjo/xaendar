import { NoArgsVoidFunction } from '@xaendar/types';

/**
 * Options for configuring an effect.
 */
export type EffectOptions = {
  /**
   * Called once, when the effect is disposed, before it stops watching its dependencies.
   */
  onCleanup?: NoArgsVoidFunction;
  /**
   * Called before each run of the effect, the first one included.
   */
  onBeforeRun?: () => void;
  /**
   * Called after each run of the effect, the first one included, also when the run throws.
   */
  onAfterRun?: () => void;
}