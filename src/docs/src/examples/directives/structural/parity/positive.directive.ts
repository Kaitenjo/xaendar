import { Directive, Property, StructuralDirective } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Renders the element while the value is greater than zero.
 */
@Directive({ selector: 'exPositive' })
export class PositiveDirective extends StructuralDirective {
  /**
   * The value to check.
   */
  @Property(0)
  public accessor value!: InputSignal<number>;

  /**
   * @returns Whether the value is positive.
   */
  public shouldRender(): boolean {
    return this.value() > 0;
  }
}
