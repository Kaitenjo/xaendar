import { Directive, Property, StructuralDirective } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Renders the element once the text is long enough.
 */
@Directive({ selector: 'exMinLength' })
export class MinLengthDirective extends StructuralDirective {
  /**
   * The text to measure.
   */
  @Property('')
  public accessor text!: InputSignal<string>;
  /**
   * The minimum length.
   */
  @Property(1)
  public accessor min!: InputSignal<number>;

  /**
   * @returns Whether the text, without the surrounding spaces, has at least `min` characters.
   */
  public shouldRender(): boolean {
    return this.text().trim().length >= this.min();
  }
}
