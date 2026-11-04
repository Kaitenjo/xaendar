import { Directive, Property, StructuralDirective } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Renders the element while the value is even.
 */
@Directive({ selector: 'exIsEven' })
export class IsEvenDirective extends StructuralDirective {
  /**
   * The value to check.
   */
  @Property(0)
  public accessor value!: InputSignal<number>;

  /**
   * @returns Whether the value is even.
   */
  public shouldRender(): boolean {
    return this.value() % 2 === 0;
  }
}
