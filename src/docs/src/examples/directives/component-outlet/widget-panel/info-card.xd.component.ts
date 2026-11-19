import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A card informing about something, created by `@@componentOutlet`.
 */
@WebComponent({
  selector: 'ex-info-card',
  styleUrl: './info-card.css',
  templateUrl: './info-card.xd.component.html'
})
export class InfoCardComponent extends CustomElement {
  /**
   * The text of the card.
   */
  @Property('')
  public accessor heading!: InputSignal<string>;
}
