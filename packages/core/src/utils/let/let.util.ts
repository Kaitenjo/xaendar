import type { NoArgsFunction } from '@xaendar/types';
import { computed } from '../../signals/computed/computed';
import type { Computed } from '../../signals/types/computed.type';

/**
 * Creates the value of a `@let` (a template variable) reading a signal, e.g. `@let total = price() * quantity();`: a
 * signal computing the value when it is read, and again once a signal the value reads changes, so that only the nodes
 * reading the `@let` are updated.
 *
 * @param compute - Computes the value.
 * @returns The signal of the value.
 */
export function _let(compute: NoArgsFunction<unknown>): Computed<unknown> {
  return computed(compute);
}
