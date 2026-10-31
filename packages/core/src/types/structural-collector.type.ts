import type { VoidFunction } from '@xaendar/types';
import type { Signal as SignalType } from '../signals/types/signal.type';

/**
 * Collects the flags of the structural directives applied to an element.
 */
export type StructuralCollector = {
  /**
   * Registers the flag of a structural directive applied to the element.
   */
  add: VoidFunction<[flag: SignalType<boolean | undefined>]>,
  /**
   * Unregisters the flag of a structural directive no longer applied to the element.
   */
  remove: VoidFunction<[flag: SignalType<boolean | undefined>]>
};
