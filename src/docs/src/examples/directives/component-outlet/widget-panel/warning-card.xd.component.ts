import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A card warning about something, created by `@@componentOutlet`.
 */
@WebComponent({
  selector: 'ex-warning-card',
  styleUrl: './warning-card.css',
  templateUrl: './warning-card.xd.component.html'
})
export class WarningCardComponent extends CustomElement {
  /**
   * The text of the card.
   */
  @Property('')
  public accessor heading!: InputSignal<string>;
}
