import type { Signal } from '@xaendar/core/signals';
import { readCount } from './store';

// The template reads the signal itself by importing it: @import { count } from './store.ts'

/**
 * A badge showing a count shared by the whole application.
 */
export class BadgeComponent extends CustomElement {
  /**
   * ✗ A call to a function of the application: text interpolations work, but attribute bindings
   * are evaluated only once.
   */
  public readonly fromHelper = readCount();
  /**
   * ✓ The same call, annotated with its signal type: the compiler relies on the annotation.
   */
  public readonly annotated: Signal<number> = readCount();
}
