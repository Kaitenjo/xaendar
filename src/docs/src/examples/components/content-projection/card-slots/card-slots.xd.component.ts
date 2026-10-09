import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Fills the slots of two cards: the second one leaves its header to the fallback.
 */
@WebComponent({
  selector: 'ex-card-slots',
  templateUrl: './card-slots.xd.component.html',
  styleUrl: './card-slots.css'
})
export class CardSlotsComponent extends CustomElement {
  /**
   * Whether the first card gets a footer.
   */
  public readonly withFooter = signal(true);
  /**
   * How many times the button in the footer was pressed.
   */
  public readonly likes = signal(0);

  /**
   * Adds or removes the footer.
   */
  public toggleFooter(): void {
    this.withFooter.update(withFooter => !withFooter);
  }

  /**
   * Counts a like.
   */
  public like(): void {
    this.likes.update(likes => likes + 1);
  }
}
