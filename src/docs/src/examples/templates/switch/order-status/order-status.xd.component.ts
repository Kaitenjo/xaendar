import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Describes the status of an order: some statuses share a branch, unknown ones fall to the default.
 */
@WebComponent({
  selector: 'ex-order-status',
  templateUrl: './order-status.xd.component.html',
  styleUrl: './order-status.css'
})
export class OrderStatusComponent extends CustomElement {
  /**
   * The statuses to choose from: the last one is not handled by any case.
   */
  public readonly statuses = ['pending', 'paid', 'shipped', 'delivered', 'lost'];
  /**
   * The status of the order.
   */
  public readonly status = signal('pending');

  /**
   * Chooses a status.
   *
   * @param status - The status.
   */
  public choose(status: string): void {
    this.status.set(status);
  }
}
