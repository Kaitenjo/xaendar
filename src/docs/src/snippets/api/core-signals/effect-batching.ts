import { effect, signal } from '@xaendar/core/signals';

/**
 * The first name.
 */
const first = signal('Ada');
/**
 * The last name.
 */
const last = signal('Lovelace');

effect(() => console.log(`${first()} ${last()}`)); // now, synchronously: "Ada Lovelace"

first.set('Grace');
last.set('Hopper');
// a single run for both writes, in a microtask: "Grace Hopper"
