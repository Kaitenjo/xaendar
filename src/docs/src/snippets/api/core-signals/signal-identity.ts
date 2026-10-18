import { signal } from '@xaendar/core/signals';

/**
 * The fruits in the basket.
 */
const fruits = signal(['apple']);

// ✗ The array changes, but the signal holds the same reference: nobody is notified
fruits().push('pear');

// ✗ The same reference again: equal by Object.is, ignored
fruits.set(fruits());

// ✓ A new array is a new value
fruits.update(list => [...list, 'pear']);
