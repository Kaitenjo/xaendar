import { signal } from '@xaendar/core/signals';

/**
 * The lines logged by the card, shared with the example that shows them.
 */
export const log = signal<Array<{ id: number; text: string }>>([]);

/**
 * The identifier of the next line.
 */
let nextId = 0;

/**
 * Appends a line to the log.
 *
 * @param text - The line.
 */
export function write(text: string): void {
  log.update(lines => [...lines, { id: nextId++, text }]);
}
