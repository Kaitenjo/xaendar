import { signal } from '@xaendar/core/signals';

/**
 * A Signal<number>, typed by its initial value.
 */
const count = signal(0);
/**
 * An explicit type, when the initial value is not enough.
 */
const user = signal<User | null>(null);

count();                          // read (tracked inside computed signals, effects and templates)
count.get();                      // the same
count.set(5);                     // replace the value
count.update(value => value + 1); // compute it from the previous one, read without tracking
