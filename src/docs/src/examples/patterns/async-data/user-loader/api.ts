/**
 * A user returned by the fake server.
 */
export type User = { id: number; name: string; email: string };

/**
 * The users known by the fake server.
 */
const USERS: User[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 2, name: 'Alan Turing', email: 'alan@example.com' },
  { id: 3, name: 'Grace Hopper', email: 'grace@example.com' }
];

/**
 * Fetches a user from a fake server. User 1 is slow, the others answer quickly, and unknown ids fail.
 *
 * @param id - The id of the user.
 * @param signal - Aborts the request.
 * @returns The user.
 */
export function fetchUser(id: number, signal?: AbortSignal): Promise<User> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const user = USERS.find(candidate => candidate.id === id);
      if (user) {
        resolve(user);
      } else {
        reject(new Error(`User ${id} not found`));
      }
    }, id === 1 ? 1500 : 500);

    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}
