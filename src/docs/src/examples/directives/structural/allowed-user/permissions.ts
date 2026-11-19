import { signal } from '@xaendar/core/signals';

/**
 * A line of the log of the permission checks.
 */
export type CheckLine = {
  /**
   * The identifier of the line, used as the key of the list.
   */
  readonly id: number;
  /**
   * What the line says.
   */
  readonly text: string;
};

/**
 * The log of the permission checks.
 */
export const checks = signal(new Array<CheckLine>());

/**
 * The id of the next line of the log.
 */
let nextId = 0;

/**
 * Writes a line in the log.
 *
 * @param text - The line.
 */
function log(text: string): void {
  const line = { id: nextId++, text };
  checks.update(lines => [...lines, line]);
}

/**
 * Asks a fake server whether a user can see the admin panel.
 *
 * @param user - The user.
 * @returns Whether the user is allowed, after 800ms.
 */
export async function canSeeAdminPanel(user: string): Promise<boolean> {
  log(`checking ${user}…`);
  await new Promise(resolve => setTimeout(resolve, 800));
  const allowed = user === 'admin';
  log(`${user}: ${allowed ? 'allowed' : 'denied'}`);
  return allowed;
}
