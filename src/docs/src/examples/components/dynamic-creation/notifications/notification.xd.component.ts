import { CustomElement, Event, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A notification, created in code by the stack showing it: its text is the content the stack gives it.
 */
@WebComponent({
  selector: 'ex-notification',
  styleUrl: './notification.css',
  templateUrl: './notification.xd.component.html'
})
export class NotificationComponent extends CustomElement {
  /**
   * How much the notification matters.
   */
  @Property<InputSignal<'info' | 'urgent'>>('info')
  public accessor level!: InputSignal<'info' | 'urgent'>;
  /**
   * Emitted when the notification is dismissed.
   */
  @Event()
  public accessor dismissed!: Output;

  /**
   * Dismisses the notification.
   */
  public dismiss(): void {
    this.dismissed.emit();
  }
}
