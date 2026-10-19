import { CustomDirective, Directive } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Marks the element it is applied to, highlighting it while it is marked.
 */
@Directive({ selector: 'exMark' })
export class MarkDirective extends CustomDirective<HTMLElement> {
  /**
   * Whether the element is marked.
   */
  public readonly marked = signal(false);

  /**
   * Keeps the class of the element in sync with the mark.
   */
  public onInit(): void {
    this.effect(() => {
      this.element.classList.toggle('marked', this.marked());
    });
  }

  /**
   * Marks the element, or removes the mark. Public, so that a query holding the directive can call it.
   */
  public toggle(): void {
    this.marked.update(marked => !marked);
  }
}
