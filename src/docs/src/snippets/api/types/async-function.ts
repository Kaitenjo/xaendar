import type { AsyncFunction } from '@xaendar/types';

/**
 * Loads a user by id: (id: number) => Promise<User>
 */
type LoadUser = AsyncFunction<[id: number], User>;

/**
 * Reads the user from the server.
 */
const loadUser: LoadUser = async id => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};
