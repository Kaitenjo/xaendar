import { CustomElement, Model, Property, Query, WebComponent } from '@xaendar/core';
import type { InputSignal, ModelSignal, QuerySignal } from '@xaendar/core/signals';

/**
 * A rating from 1 to 5 stars taking part in the form holding it, as a native field does: its value goes with the form,
 * its validity blocks the submission, the reset of the form empties it and a disabled `<fieldset>` disables it. Once
 * touched and invalid, it is outlined (`:host(:state(touched):invalid)`).
 */
@WebComponent({
  selector: 'ex-rating-input',
  formAssociated: true,
  styleUrl: './rating-input.css',
  templateUrl: './rating-input.xd.component.html'
})
export class RatingInputComponent extends CustomElement {
  /**
   * The rating, 0 for none.
   */
  @Model(0)
  public accessor value!: ModelSignal<number>;
  /**
   * Whether a rating is required to submit the form.
   */
  @Property(false)
  public accessor required!: InputSignal<boolean>;
  /**
   * The first star, where the browser shows the message of the validity.
   */
  @Query('button')
  public accessor firstStar!: QuerySignal<HTMLButtonElement | null>;
  /**
   * The values of the stars.
   */
  public readonly stars = [1, 2, 3, 4, 5];

  /**
   * Gives the form the rating and its validity, following their signals.
   */
  public onInit(): void {
    this.setFormValue(this.value, value => value ? String(value) : null);
    this.setFormValidators([() => this.required() && !this.value() ? { valueMissing: 'Choose a rating.' } : undefined], () => this.firstStar() ?? undefined);
  }

  /**
   * Takes back the rating the browser restores, going back to the page: it gave the form a text.
   *
   * @param state - The text given to the form.
   */
  public formStateRestoreCallback(state: string): void {
    this.value.set(Number(state));
  }
}
