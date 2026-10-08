import { Directive, Property, StructuralDirective } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Renders the element it is applied to only while its condition is true.
 */
@Directive({ selector: 'exVisibleWhen' })
export class VisibleWhenDirective extends StructuralDirective {
  /**
   * Whether the element is rendered.
   */
  @Property(false)
  public accessor condition!: InputSignal<boolean>;

  /**
   * Evaluated again whenever the condition changes.
   *
   * @returns The condition.
   */
  public shouldRender(): boolean {
    return this.condition();
  }
}
