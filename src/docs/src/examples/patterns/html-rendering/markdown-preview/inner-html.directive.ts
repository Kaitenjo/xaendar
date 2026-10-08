import { CustomDirective, Directive, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Replaces the content of the element with an HTML string. The string is trusted as it is:
 * whatever builds it is responsible for escaping or sanitizing it.
 */
@Directive({ selector: 'exInnerHtml' })
export class InnerHtmlDirective extends CustomDirective<HTMLElement> {
  /**
   * The HTML to render.
   */
  @Property('')
  public accessor html!: InputSignal<string>;

  /**
   * Renders the HTML whenever it changes.
   */
  public onInit(): void {
    this.effect(() => {
      this.element.innerHTML = this.html();
    });
  }
}
