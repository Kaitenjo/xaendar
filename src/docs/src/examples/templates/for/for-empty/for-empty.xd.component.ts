import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A list with an empty state, written with @if and @else around the loop.
 */
@WebComponent({
  selector: 'ex-for-empty',
  templateUrl: './for-empty.xd.component.html',
  styleUrl: './for-empty.css'
})
export class ForEmptyComponent extends CustomElement {
  /**
   * The messages.
   */
  public readonly messages = signal(['Welcome!', 'Your order has shipped']);

  /**
   * Removes the oldest message.
   */
  public dismiss(): void {
    this.messages.update(messages => messages.slice(1));
  }

  /**
   * Adds a message.
   */
  public receive(): void {
    this.messages.update(messages => [...messages, `Message ${messages.length + 1}`]);
  }
}
