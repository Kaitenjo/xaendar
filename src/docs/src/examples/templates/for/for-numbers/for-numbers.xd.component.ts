import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Repeats blocks a number of times: a fixed number, and one held by a signal.
 */
@WebComponent({
  selector: 'ex-for-numbers',
  templateUrl: './for-numbers.xd.component.html',
  styleUrl: './for-numbers.css'
})
export class ForNumbersComponent extends CustomElement {
  /**
   * The rating, from 0 to 5.
   */
  public readonly rating = signal(3);

  /**
   * Reads the slider.
   *
   * @param event - The input event of the slider.
   */
  public setRating(event: Event): void {
    this.rating.set(Number((event.target as HTMLInputElement).value));
  }
}
