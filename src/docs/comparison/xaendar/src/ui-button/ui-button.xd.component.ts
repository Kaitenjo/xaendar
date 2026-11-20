import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * The button of the page: its content is projected, its click is the native one.
 */
@WebComponent({
  selector: 'ui-button',
  styleUrl: '../../../shared/button.css',
  templateUrl: './ui-button.xd.component.html'
})
export class UiButtonComponent extends CustomElement {
  /**
   * `primary` or `secondary`.
   */
  @Property('secondary')
  public accessor variant!: InputSignal<string>;
}
