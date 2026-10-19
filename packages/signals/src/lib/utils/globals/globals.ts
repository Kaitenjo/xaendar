import { Stack } from '@xaendar/common';
import { Computed } from '../../models/computed/computed';
import { GlobalState } from '../../types/global-state.type';

/**
 * Global state for the signals runtime.
 * Tracks the currently computing `Computed` instance, whether the state is frozen,
 * and the version of the State values.
 *
 * @internal
 */
export const GLOBAL_STATE: GlobalState = {
  computing: null,
  frozen: false,
  version: 0
};

/**
 * The value `GLOBAL_STATE.computing` had when each running `Computed` started computing, innermost last:
 * `null` included, as for a `Computed` evaluated inside `untrack`.
 */
const computingStack = new Stack<Computed | null>;

/**
 * Saves the currently active computation onto the computing stack and sets the
 * `Computed` instance as the currently active computation in `GLOBAL_STATE`.
 *
 * Should be called before executing a computed function to register
 * dependency tracking.
 *
 * @param computed - The `Computed` instance entering the computation phase.
 * @internal
 */
export function pushComputed(computed: Computed): void {
  computingStack.push(GLOBAL_STATE.computing);
  GLOBAL_STATE.computing = computed;
}

/**
 * Restores, as the active computation in `GLOBAL_STATE`, the one saved by the last
 * {@link pushComputed}: the computation it interrupted, or `null` if there was none.
 *
 * Should be called after a computed function finishes executing.
 *
 * @internal
 */
export function popComputed(): void {
  GLOBAL_STATE.computing = computingStack.pop() ?? null;
}