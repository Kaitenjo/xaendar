import type { Computed } from '@xaendar/core/signals';
import { count } from './store';

export class BadgeComponent extends CustomElement {
  // ✗ Text interpolations work, but attribute bindings are evaluated only once:
  //   the compiler cannot tell that this member holds a signal
  public readonly untyped = count;

  // ✓ Annotated with a signal type imported from '@xaendar/core/signals'
  public readonly typed: Computed<number> = count;
}
