import { CustomDirective, Directive } from '@xaendar/core';

/**
 * Marks the newest notification, for as long as it is applied.
 */
@Directive({ selector: 'exNewest' })
export class NewestDirective extends CustomDirective<HTMLElement> {
  /**
   * Marks the element.
   */
  public onInit(): void {
    this.element.classList.add('newest');
  }

  /**
   * Unmarks the element, since it outlives the directive.
   */
  public onDestroy(): void {
    this.element.classList.remove('newest');
  }
}
