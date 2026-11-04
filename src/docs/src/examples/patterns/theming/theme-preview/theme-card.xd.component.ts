import { CustomElement, WebComponent, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A card styled only through custom properties and a part: it knows nothing about the themes.
 */
@WebComponent({
  selector: 'ex-theme-card',
  styleUrl: './theme-card.css',
  templateUrl: './theme-card.xd.component.html'
})
export class ThemeCardComponent extends CustomElement {
  /**
   * The heading of the card.
   */
  @Property('')
  public accessor heading!: InputSignal<string>;
}
