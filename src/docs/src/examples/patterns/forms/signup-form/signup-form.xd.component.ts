import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * A form read through its events, validated by a computed signal.
 */
@WebComponent({
  selector: 'ex-signup-form',
  templateUrl: './signup-form.xd.component.html',
  styleUrl: './signup-form.css'
})
export class SignupFormComponent extends CustomElement {
  /**
   * The name typed.
   */
  public readonly name = signal('');
  /**
   * The email typed.
   */
  public readonly email = signal('');
  /**
   * The plan chosen.
   */
  public readonly plan = signal('free');
  /**
   * Whether the terms are accepted.
   */
  public readonly terms = signal(false);
  /**
   * Whether the user tried to submit: errors are shown from then on.
   */
  public readonly attempted = signal(false);
  /**
   * The data sent by the last valid submit.
   */
  public readonly sent = signal('');
  /**
   * The problems of the form, recomputed whenever a field changes.
   */
  public readonly errors = computed(() => this._computeErrors());

  /**
   * Stores the name.
   *
   * @param event - The input event of the field.
   */
  public setName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  /**
   * Stores the email.
   *
   * @param event - The input event of the field.
   */
  public setEmail(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  /**
   * Stores the plan.
   *
   * @param event - The change event of the select.
   */
  public setPlan(event: Event): void {
    this.plan.set((event.target as HTMLSelectElement).value);
  }

  /**
   * Stores whether the terms are accepted.
   *
   * @param event - The change event of the checkbox.
   */
  public setTerms(event: Event): void {
    this.terms.set((event.target as HTMLInputElement).checked);
  }

  /**
   * Sends the form, if it is valid. The default submit would reload the page.
   *
   * @param event - The submit event.
   */
  public submit(event: SubmitEvent): void {
    event.preventDefault();
    this.attempted.set(true);
    if (this.errors().length === 0) {
      this.sent.set(JSON.stringify({ name: this.name().trim(), email: this.email(), plan: this.plan() }));
    }
  }

  /**
   * Computes the value of `errors`.
   *
   * @returns The problems of the form.
   */
  private _computeErrors(): string[] {
    const errors = new Array<string>();
    if (this.name().trim().length < 2) {
      errors.push('The name needs at least 2 characters.');
    }
    if (!/^[^@\s]+@[^@\s]+\.[a-z]+$/i.test(this.email())) {
      errors.push('The email is not valid.');
    }
    if (!this.terms()) {
      errors.push('The terms must be accepted.');
    }
    return errors;
  }
}
