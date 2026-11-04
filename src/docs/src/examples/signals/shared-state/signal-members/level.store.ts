import { signal } from '@xaendar/core/signals';
import type { Signal } from '@xaendar/core/signals';

/**
 * A level from 0 to 10, shared through a module.
 */
export const level = signal(3);

/**
 * Returns the shared level.
 *
 * @returns The signal holding the level.
 */
export function readLevel(): Signal<number> {
  return level;
}
