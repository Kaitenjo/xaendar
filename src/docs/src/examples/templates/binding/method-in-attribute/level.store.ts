import { signal } from '@xaendar/core/signals';

/**
 * A level from 0 to 10, shared through a module.
 */
export const level = signal(3);

/**
 * Reads the shared level as a percentage.
 *
 * @returns The percentage.
 */
export function readPercent(): number {
  return level() * 10;
}
