import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Details rendered once they are requested, by the `when` trigger of a `@defer`: they stay when the request is withdrawn,
 * since the content of a `@defer` is rendered once.
 */
@WebComponent({
  selector: 'ex-details',
  styleUrl: './details.css',
  templateUrl: './details.xd.component.html'
})
export class DetailsComponent extends CustomElement {
  /**
   * Whether the details are requested.
   */
  public readonly requested = signal(false);

  /**
   * Requests the details, or withdraws the request.
   */
  public toggle(): void {
    this.requested.update(requested => !requested);
  }
}
