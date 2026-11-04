import { CustomDirective, Directive, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Paints the background of the element it is applied to.
 */
@Directive({ selector: 'exTint' })
export class TintDirective extends CustomDirective<HTMLElement> {
  /**
   * The background color.
   */
  @Property('#fde68a')
  public accessor color!: InputSignal<string>;

  /**
   * Keeps the background in sync with the input.
   */
  public onInit(): void {
    this.effect(() => {
      this.element.style.backgroundColor = this.color();
    });
  }
}
