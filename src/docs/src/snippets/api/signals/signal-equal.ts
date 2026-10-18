import { signal } from '@xaendar/core/signals';
import type { SignalEqual } from '@xaendar/signals';
import type { User } from './user';

/**
 * Two users are equal when they have the same id. SignalEqual types the values as any: the annotations check them.
 */
export const sameUser: SignalEqual<User> = (current: User, next: User) => current.id === next.id;

/**
 * The user being edited.
 */
const edited = signal<User>({ id: 1, name: 'Ada' }, { equals: sameUser });
