import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * A five-star rating: the three files of a component, with state, derived state and event handlers.
 */
@WebComponent({
  selector: 'ex-rating',
  styleUrl: './rating.css',
  templateUrl: './rating.xd.component.html'
})
export class RatingComponent extends CustomElement {
  /**
   * The stars to draw. A plain member: the template reads it, but it never changes.
   */
  public readonly stars = [1, 2, 3, 4, 5];
  /**
   * The chosen rating.
   */
  public readonly value = signal(3);
  /**
   * The star under the pointer, 0 when there is none.
   */
  public readonly hovered = signal(0);
  /**
   * The rating to draw: the hovered star wins over the chosen one.
   */
  public readonly shown = computed(() => this._computeShown());
  /**
   * The text of the rating to draw.
   */
  public readonly label = computed(() => this._computeLabel());
  /**
   * The text shown for each rating, from one to five stars.
   */
  private readonly _labels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

  /**
   * Chooses a rating.
   *
   * @param star - The clicked star.
   */
  public rate(star: number): void {
    this.value.set(star);
  }

  /**
   * Previews a rating while the pointer is over a star.
   *
   * @param star - The hovered star.
   */
  public preview(star: number): void {
    this.hovered.set(star);
  }

  /**
   * Stops previewing when the pointer leaves the stars.
   */
  public clearPreview(): void {
    this.hovered.set(0);
  }

  /**
   * Computes the value of `shown`.
   *
   * @returns The rating to draw: the hovered star wins over the chosen one.
   */
  private _computeShown(): number {
    return this.hovered() || this.value();
  }

  /**
   * Computes the value of `label`.
   *
   * @returns The text of the rating to draw.
   */
  private _computeLabel(): string | undefined {
    return this._labels[this.shown() - 1];
  }
}
