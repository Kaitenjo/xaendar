import { signal } from '@xaendar/core/signals';

/**
 * A name compared without case.
 */
const name = signal('Ada', {
  equals: (current: string, next: string) => current.toLowerCase() === next.toLowerCase()
});

name.set('ADA');   // equal: ignored, nobody is notified
name();            // 'Ada': the old value is kept
name.set('Grace');
name();            // 'Grace'
