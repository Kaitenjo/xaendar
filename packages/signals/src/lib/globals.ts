import { Stack } from '@xendar/common';
import { Computed } from './models/computed';
import { GlobalState } from './types/global-state.type';

/**
 * Global state for the signals runtime.
 * Tracks the currently computing `Computed` instance, whether the state is frozen,
 * and the current generation counter.
 *
 * @internal
 */
export const GLOBAL_STATE: GlobalState = {
  computing: null,
  frozen: false
};

const computingStack = new Stack<Computed>;

/**
 * Pushes a `Computed` instance onto the computing stack and sets it as the
 * currently active computation in `GLOBAL_STATE`.
 *
 * Should be called before executing a computed function to register
 * dependency tracking.
 *
 * @param computed - The `Computed` instance entering the computation phase.
 * @internal
 */
export function pushComputed(computed: Computed): void {
  computingStack.push(computed);
  GLOBAL_STATE.computing = computed;
}

/**
 * Pops the most recent `Computed` instance from the computing stack and
 * restores the previous one as the active computation in `GLOBAL_STATE`.
 *
 * Should be called after a computed function finishes executing.
 *
 * @internal
 */
export function popComputed(): void {
  computingStack.pop();
  GLOBAL_STATE.computing = computingStack[computingStack.length - 1] ?? null;
}