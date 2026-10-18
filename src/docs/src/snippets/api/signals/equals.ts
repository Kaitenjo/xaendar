import { signal } from '@xaendar/core/signals';
import type { User } from './user';

/**
 * The selected user: another object with the same id is not a change.
 */
const selected = signal<User>({ id: 1, name: 'Ada' }, {
  equals: (current: User, next: User) => current.id === next.id
});

selected.set({ id: 1, name: 'Ada Lovelace' });  // equal: ignored, selected() is still the first object
selected.set({ id: 2, name: 'Grace Hopper' });  // a change: stored, and the dependents are told
