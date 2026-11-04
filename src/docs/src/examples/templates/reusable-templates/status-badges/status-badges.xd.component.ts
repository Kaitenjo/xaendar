import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Renders three badges from a template whose tone has a default value and whose count is optional.
 */
@WebComponent({
  selector: 'ex-status-badges',
  styleUrl: './status-badges.css',
  templateUrl: './status-badges.xd.component.html'
})
export class StatusBadgesComponent extends CustomElement {
  /**
   * The number of items waiting for a review.
   */
  public readonly pending = signal(2);

  /**
   * Sends an item to review: only the count of the second badge changes.
   */
  public review(): void {
    this.pending.update(pending => pending + 1);
  }
}
