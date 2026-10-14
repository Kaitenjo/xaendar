import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import './vanilla-stars';

/**
 * Uses a custom element of another library in its template: its tag matches the customElements of xaendar.json.
 */
@WebComponent({
  selector: 'ex-foreign-element',
  styleUrl: './foreign-element.css',
  templateUrl: './foreign-element.xd.component.html'
})
export class ForeignElementComponent extends CustomElement {
  /**
   * The rating shown by the stars.
   */
  public readonly rating = signal(3);

  /**
   * Stores the rating of the star clicked. The event is not in HTMLElementEventMap, so $event is any: the type of
   * the parameter is the one the library documents.
   *
   * @param event - The event of the stars, carrying the rating.
   */
  public setRating(event: CustomEvent<number>): void {
    this.rating.set(event.detail);
  }
}
