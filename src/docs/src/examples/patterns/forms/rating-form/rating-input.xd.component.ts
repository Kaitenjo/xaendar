import { CustomElement, Model, Property, Query, WebComponent } from '@xaendar/core';
import type { InputSignal, ModelSignal, QuerySignal } from '@xaendar/core/signals';
import { FormControlDirective } from '@xaendar/directives';

/**
 * A rating from 1 to 5 stars taking part in the form holding it, as a native field does: its value goes with the form,
 * its validity blocks the submission, the reset of the form empties it and a disabled `<fieldset>` disables it. Once
 * touched and invalid, it is outlined (`:host(:state(touched):invalid)`).
 */
@WebComponent({
  selector: 'ex-rating-input',
  hostDirectives: [FormControlDirective],
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
   * The form control of the element, a host directive: the template reads its disabled state.
   */
  public readonly control = this.hostDirectives.get(FormControlDirective)!;

  /**
   * Gives the form the rating and its validity, following their signals.
   */
  public onInit(): void {
    this.control.setValue(this.value, value => value ? String(value) : null);
    this.control.setValidators([() => this.required() && !this.value() ? { valueMissing: 'Choose a rating.' } : undefined], () => this.firstStar() ?? undefined);
  }

  /**
   * Takes back the rating the browser restores, going back to the page: it gave the form a text, which the form control
   * cannot turn back into a number.
   *
   * @param state - The text given to the form.
   */
  public formStateRestoreCallback(state: string): void {
    this.value.set(Number(state));
  }
}
