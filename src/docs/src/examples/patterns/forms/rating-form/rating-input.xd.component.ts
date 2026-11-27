import { CustomElement, Model, Property, Query, WebComponent } from '@xaendar/core';
import type { InputSignal, ModelSignal, QuerySignal } from '@xaendar/core/signals';
import { FormAssociatedDirective, min } from '@xaendar/forms';

/**
 * A rating from 1 to 5 stars taking part in the form holding it, as a native field does: its value goes with the form,
 * its own constraint (`required`) blocks the submission, the reset of the form empties it and a disabled `<fieldset>`
 * disables it. Touched and invalid, as `FormFieldDirective` marks it, it is outlined (`:host(:state(touched):invalid)`).
 */
@WebComponent({
  selector: 'ex-rating-input',
  hostDirectives: [FormAssociatedDirective],
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
   * Whether a rating is required to submit the form, as the `required` of a native field.
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
   * The bridge with the form, a host directive: the template reads its disabled state.
   */
  public readonly form = this.hostDirectives.get(FormAssociatedDirective)!;

  /**
   * Gives the form the rating and its own constraint, following their signals.
   */
  public onInit(): void {
    // 0 is the value of no rating, not an empty one: at least 1 star is what a rating asks
    const chosen = min(1, 'Choose a rating.');
    this.form.setValue(this.value, value => value ? String(value) : null);
    this.form.setValidators([value => this.required() ? chosen(value) : undefined], () => this.firstStar() ?? undefined);
  }

  /**
   * Gives the rating the user chose, and says so as a native field does, `input` then `change`: a `FormFieldDirective`
   * applied to the component marks it dirty.
   *
   * @param star - The rating.
   */
  public choose(star: number): void {
    this.value.set(star);
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Takes back the rating the browser restores, going back to the page: it gave the form a text, which the bridge cannot
   * turn back into a number.
   *
   * @param state - The text given to the form.
   */
  public formStateRestoreCallback(state: string): void {
    this.value.set(Number(state));
  }
}
